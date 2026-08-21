import {
  buildExternalInstitutionId,
  CampaignStatus,
  campaignIdAsString,
  createCampaign,
  importSourceFormatFromFileName,
  ImportSourceFormat,
} from "@eduatlas/domain";
import { assertOperationAllowed, type BillingProtectionRepository } from "../billing-protection";
import { parseCsvTable } from "../institution-import/parsers/csv-table-parser";
import { decodeImportTextBytes } from "../institution-import/parsers/decode-import-text";
import { parseExcelTable } from "../institution-import/parsers/excel-table-parser";
import type { CampaignRepository } from "./campaign-repository";
import { enqueuePreparedTargets, type PreparedTarget } from "./enqueue-prepared-targets";
import { OutreachValidationError } from "./errors";
import type { PrepareCampaignDependencies, PrepareCampaignResult } from "./prepare-campaign";

/** Max upload size for outreach recipient files (5 MiB). */
export const OUTREACH_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
/** Max data rows (excluding header). */
export const OUTREACH_IMPORT_MAX_ROWS = 5_000;

const EMAIL_COLUMN_ALIASES = Object.freeze([
  "email",
  "e-mail",
  "mail",
  "eposta",
  "e_posta",
  "e-posta",
]);
const NAME_COLUMN_ALIASES = Object.freeze([
  "institutionname",
  "institution_name",
  "institution name",
  "name",
  "kurumadi",
  "kurum_adi",
  "kurum adı",
  "okuladi",
  "okul adı",
]);

export type OutreachImportRowError = Readonly<{
  readonly rowNumber: number;
  readonly message: string;
}>;

export type OutreachImportAcceptedRow = Readonly<{
  readonly rowNumber: number;
  readonly institutionName: string;
  readonly email: string;
  readonly institutionId: string;
}>;

export type OutreachImportParseResult = Readonly<{
  readonly fileName: string;
  readonly rowCount: number;
  readonly accepted: readonly OutreachImportAcceptedRow[];
  readonly rejected: readonly OutreachImportRowError[];
  readonly duplicateEmailCount: number;
}>;

export type PrepareCampaignFromImportInput = Readonly<{
  readonly campaignId: string;
  readonly fileName: string;
  readonly content: Uint8Array;
  readonly now: string;
}>;

export type PrepareCampaignFromImportDependencies = PrepareCampaignDependencies &
  Readonly<{
    readonly campaignRepository: CampaignRepository;
    readonly billingProtectionRepository?: BillingProtectionRepository | null;
  }>;

/**
 * Strips formula-injection prefixes and HTML-ish markup from import cells.
 */
export function sanitizeOutreachImportCell(raw: string): string {
  let value = raw.replace(/\u0000/g, "").trim();
  // Excel formula injection: leading = + - @
  while (/^[=+\-@]/.test(value)) {
    value = value.slice(1).trim();
  }
  // Strip simple HTML tags
  value = value.replace(/<[^>]*>/g, " ");
  value = value.replace(/\s+/g, " ").trim();
  return value;
}

function normalizeHeader(header: string): string {
  return sanitizeOutreachImportCell(header).toLocaleLowerCase("tr-TR");
}

function findColumnIndex(headers: readonly string[], aliases: readonly string[]): number {
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

function isValidEmail(email: string): boolean {
  if (!email.includes("@") || email.includes(" ")) return false;
  const [local, domain] = email.split("@");
  return Boolean(local && domain && domain.includes("."));
}

/**
 * Parses and validates an outreach recipient CSV/XLSX (institutionName + email).
 */
export function parseOutreachRecipientImport(input: {
  fileName: string;
  content: Uint8Array;
}): OutreachImportParseResult {
  const fileName = input.fileName.trim();
  if (!fileName) {
    throw new OutreachValidationError("Dosya adı gerekli.");
  }
  if (input.content.byteLength === 0) {
    throw new OutreachValidationError("Dosya boş.");
  }
  if (input.content.byteLength > OUTREACH_IMPORT_MAX_BYTES) {
    throw new OutreachValidationError(
      `Dosya çok büyük (en fazla ${Math.floor(OUTREACH_IMPORT_MAX_BYTES / (1024 * 1024))} MB).`,
    );
  }

  const format = importSourceFormatFromFileName(fileName);
  if (!format || (format !== ImportSourceFormat.Csv && format !== ImportSourceFormat.Xlsx)) {
    throw new OutreachValidationError("Sadece .csv ve .xlsx dosyaları destekleniyor.");
  }

  let matrix: string[][];
  try {
    matrix =
      format === ImportSourceFormat.Csv
        ? parseCsvTable(decodeImportTextBytes(input.content))
        : parseExcelTable(input.content);
  } catch {
    throw new OutreachValidationError("Dosya okunamadı. Geçerli bir CSV veya Excel yükleyin.");
  }

  if (matrix.length < 2) {
    throw new OutreachValidationError("Dosyada başlık ve en az bir veri satırı olmalı.");
  }

  const headers = matrix[0] ?? [];
  const nameIdx = findColumnIndex(headers, NAME_COLUMN_ALIASES);
  const emailIdx = findColumnIndex(headers, EMAIL_COLUMN_ALIASES);
  if (nameIdx < 0 || emailIdx < 0) {
    throw new OutreachValidationError(
      'Zorunlu kolonlar eksik: "institutionName" ve "email" (veya Türkçe eşdeğerleri).',
    );
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > OUTREACH_IMPORT_MAX_ROWS) {
    throw new OutreachValidationError(
      `En fazla ${OUTREACH_IMPORT_MAX_ROWS} satır destekleniyor (başlık hariç).`,
    );
  }

  const accepted: OutreachImportAcceptedRow[] = [];
  const rejected: OutreachImportRowError[] = [];
  const seenEmails = new Set<string>();
  let duplicateEmailCount = 0;

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2; // 1-based with header
    const institutionName = sanitizeOutreachImportCell(String(row[nameIdx] ?? ""));
    const email = sanitizeOutreachImportCell(String(row[emailIdx] ?? "")).toLowerCase();

    if (!institutionName && !email) {
      return; // skip blank lines
    }
    if (!institutionName) {
      rejected.push(
        Object.freeze({ rowNumber, message: "institutionName boş." }),
      );
      return;
    }
    if (!isValidEmail(email)) {
      rejected.push(Object.freeze({ rowNumber, message: "Geçersiz email." }));
      return;
    }
    if (seenEmails.has(email)) {
      duplicateEmailCount += 1;
      return;
    }
    seenEmails.add(email);
    accepted.push(
      Object.freeze({
        rowNumber,
        institutionName,
        email,
        institutionId: buildExternalInstitutionId(email),
      }),
    );
  });

  return Object.freeze({
    fileName,
    rowCount: dataRows.filter((row) =>
      sanitizeOutreachImportCell(String(row[nameIdx] ?? "")) ||
      sanitizeOutreachImportCell(String(row[emailIdx] ?? "")),
    ).length,
    accepted: Object.freeze(accepted),
    rejected: Object.freeze(rejected),
    duplicateEmailCount,
  });
}

/**
 * Validates import file and enqueues recipients/jobs for a draft campaign.
 * Does not start sending. Sets recipientSource + importMeta; leaves status draft.
 */
export async function prepareCampaignFromImport(
  input: PrepareCampaignFromImportInput,
  deps: PrepareCampaignFromImportDependencies,
): Promise<PrepareCampaignResult & { parse: OutreachImportParseResult }> {
  const campaign = await deps.campaignRepository.getById(input.campaignId.trim());
  if (!campaign) {
    throw new OutreachValidationError(`Campaign not found: ${input.campaignId}`);
  }
  if (campaign.status !== CampaignStatus.Draft) {
    throw new OutreachValidationError("Only draft campaigns can import recipients.");
  }

  await assertOperationAllowed("OUTREACH_PREPARE", {
    billingProtectionRepository: deps.billingProtectionRepository,
  });

  const parse = parseOutreachRecipientImport({
    fileName: input.fileName,
    content: input.content,
  });

  const targetLimit = Math.max(1, deps.targetLimit ?? deps.config.warmupBatchSize);
  const campaignId = campaignIdAsString(campaign.id);
  const existingRecipients = await deps.recipientRepository.listByCampaignId(campaignId);

  const targets: PreparedTarget[] = parse.accepted.map((row) =>
    Object.freeze({
      institutionId: row.institutionId,
      email: row.email,
      displayName: row.institutionName,
    }),
  );

  const result = await enqueuePreparedTargets(
    {
      campaign,
      now: input.now,
      targets,
      targetLimit,
      existingRecipientInstitutionIds: new Set(existingRecipients.map((r) => r.institutionId)),
      existingRecipientCount: existingRecipients.length,
    },
    deps,
  );

  const updated = createCampaign({
    id: campaignId,
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    channel: campaign.channel,
    templateId: campaign.templateId,
    segmentId: campaign.segmentId,
    recipientSource: "external_import",
    importMeta: {
      fileName: parse.fileName,
      rowCount: parse.rowCount,
      acceptedCount: parse.accepted.length,
      rejectedCount: parse.rejected.length,
      duplicateEmailCount: parse.duplicateEmailCount,
      importedAt: input.now,
    },
    subjectOverride: campaign.subjectOverride,
    preheader: campaign.preheader,
    createdAt: campaign.createdAt,
    createdBy: campaign.createdBy,
    startedAt: campaign.startedAt,
    completedAt: campaign.completedAt,
    preSendChecklist: campaign.preSendChecklist,
    execution: {
      ...(campaign.execution ?? {}),
      preparedAt: input.now,
    },
    postSummary: campaign.postSummary,
    learnings: campaign.learnings,
  });
  await deps.campaignRepository.update(updated);

  return Object.freeze({ ...result, parse });
}
