import {
  buildExternalInstitutionId,
  CampaignRecipientStatus,
  CampaignStatus,
  campaignIdAsString,
  createCampaign,
  createCampaignRecipient,
  importSourceFormatFromFileName,
  ImportSourceFormat,
  institutionIdAsString,
  type CampaignRecipientInstitutionMatch,
} from "@eduatlas/domain";
import { assertOperationAllowed, type BillingProtectionRepository } from "../billing-protection";
import { parseCsvTable } from "../institution-import/parsers/csv-table-parser";
import { decodeImportTextBytes } from "../institution-import/parsers/decode-import-text";
import { parseExcelTable } from "../institution-import/parsers/excel-table-parser";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { CampaignRepository } from "./campaign-repository";
import {
  promotePendingRecipientsToJobs,
} from "./enqueue-prepared-targets";
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
  readonly institutionMatch: CampaignRecipientInstitutionMatch;
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

export type ImportExternalRecipientsInput = Readonly<{
  readonly campaignId: string;
  readonly fileName: string;
  readonly content: Uint8Array;
  readonly now: string;
}>;

export type ImportExternalRecipientsResult = Readonly<{
  readonly parse: OutreachImportParseResult;
  readonly recipientCount: number;
  readonly matchedCount: number;
  readonly unmatchedCount: number;
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

function normalizeInstitutionName(name: string): string {
  return name.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

/**
 * Best-effort catalog match: exact contact email, else unique exact name.
 * Never invents institution ids from the name string alone.
 */
export async function resolveOutreachInstitutionMatch(
  row: { institutionName: string; email: string },
  institutionRepository: InstitutionRepository | null | undefined,
): Promise<{
  institutionId: string;
  institutionMatch: CampaignRecipientInstitutionMatch;
}> {
  const externalId = buildExternalInstitutionId(row.email);
  if (!institutionRepository) {
    return Object.freeze({
      institutionId: externalId,
      institutionMatch: "unmatched" as const,
    });
  }

  const emailNeedle = row.email.trim().toLowerCase();
  const nameNeedle = normalizeInstitutionName(row.institutionName);

  const byEmail = await institutionRepository.list({
    filters: { query: emailNeedle },
    pageSize: 50,
  });
  const emailHit = byEmail.items.find(
    (inst) => inst.contact.email?.trim().toLowerCase() === emailNeedle,
  );
  if (emailHit) {
    return Object.freeze({
      institutionId: institutionIdAsString(emailHit.id),
      institutionMatch: "matched" as const,
    });
  }

  const byName = await institutionRepository.list({
    filters: { query: row.institutionName },
    pageSize: 50,
  });
  const nameHits = byName.items.filter(
    (inst) => normalizeInstitutionName(inst.name) === nameNeedle,
  );
  if (nameHits.length === 1 && nameHits[0]) {
    return Object.freeze({
      institutionId: institutionIdAsString(nameHits[0].id),
      institutionMatch: "matched" as const,
    });
  }

  return Object.freeze({
    institutionId: externalId,
    institutionMatch: "unmatched" as const,
  });
}

/**
 * Parses and validates an outreach recipient CSV/XLSX (institutionName + email).
 * Does not resolve catalog matches — callers attach match metadata after parse.
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
        institutionMatch: "unmatched" as const,
      }),
    );
  });

  return Object.freeze({
    fileName,
    rowCount: dataRows.filter(
      (row) =>
        sanitizeOutreachImportCell(String(row[nameIdx] ?? "")) ||
        sanitizeOutreachImportCell(String(row[emailIdx] ?? "")),
    ).length,
    accepted: Object.freeze(accepted),
    rejected: Object.freeze(rejected),
    duplicateEmailCount,
  });
}

async function attachInstitutionMatches(
  parse: OutreachImportParseResult,
  institutionRepository: InstitutionRepository | null | undefined,
): Promise<OutreachImportParseResult> {
  const accepted: OutreachImportAcceptedRow[] = [];
  for (const row of parse.accepted) {
    const match = await resolveOutreachInstitutionMatch(row, institutionRepository);
    accepted.push(
      Object.freeze({
        ...row,
        institutionId: match.institutionId,
        institutionMatch: match.institutionMatch,
      }),
    );
  }
  return Object.freeze({
    ...parse,
    accepted: Object.freeze(accepted),
  });
}

/**
 * Persists Excel/CSV recipients as Pending CampaignRecipients (no DeliveryJobs).
 * Idempotent for draft re-import before Prepare: replaces prior Pending rows.
 *
 * Cost safety: does NOT call assertOperationAllowed("OUTREACH_PREPARE") — that gate
 * protects segment preview / catalog prepare scans. External import only reads the
 * upload bytes and writes campaign-scoped recipient rows (no institution catalog scan).
 */
export async function importExternalRecipients(
  input: ImportExternalRecipientsInput,
  deps: {
    readonly campaignRepository: CampaignRepository;
    readonly recipientRepository: CampaignRecipientRepository;
    /**
     * Optional. When omitted/null, rows stay unmatched (ext: ids) — preferred under
     * cost protection. Catalog list matching is never required for import persistence.
     */
    readonly institutionRepository?: InstitutionRepository | null;
    /** Unused for import (kept for call-site compatibility). Do not gate import on this. */
    readonly billingProtectionRepository?: BillingProtectionRepository | null;
    readonly nextRecipientId?: () => string;
    /**
     * When true (default false), attempt catalog match via institutionRepository.list.
     * Must stay false on the Growth Center import path to avoid catalog reads.
     */
    readonly resolveCatalogMatches?: boolean;
  },
): Promise<ImportExternalRecipientsResult> {
  const campaign = await deps.campaignRepository.getById(input.campaignId.trim());
  if (!campaign) {
    throw new OutreachValidationError(`Campaign not found: ${input.campaignId}`);
  }
  if (campaign.status !== CampaignStatus.Draft) {
    throw new OutreachValidationError("Only draft campaigns can import recipients.");
  }

  // Intentionally no OUTREACH_PREPARE / billing assert — import is file-scoped only.

  const parsed = parseOutreachRecipientImport({
    fileName: input.fileName,
    content: input.content,
  });
  const parse =
    deps.resolveCatalogMatches === true
      ? await attachInstitutionMatches(parsed, deps.institutionRepository)
      : parsed;

  if (parse.accepted.length === 0) {
    throw new OutreachValidationError("İçe aktarılacak geçerli alıcı yok.");
  }

  const campaignId = campaignIdAsString(campaign.id);
  const existing = await deps.recipientRepository.listByCampaignId(campaignId);
  const prepared = existing.filter((r) => r.status !== CampaignRecipientStatus.Pending);
  if (prepared.length > 0) {
    throw new OutreachValidationError(
      "Bu kampanyada Prepare edilmiş alıcılar var. Yeniden import için yeni taslak kullanın.",
    );
  }

  if (existing.length > 0) {
    await deps.recipientRepository.deleteByCampaignId(campaignId);
  }

  let seq = 0;
  const nextId = () =>
    deps.nextRecipientId?.() ?? `crec_imp_${Date.now().toString(36)}_${++seq}`;
  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const row of parse.accepted) {
    if (row.institutionMatch === "matched") matchedCount += 1;
    else unmatchedCount += 1;

    const recipient = createCampaignRecipient({
      id: nextId(),
      campaignId,
      institutionId: row.institutionId,
      displayName: row.institutionName,
      institutionMatch: row.institutionMatch,
      email: row.email,
      status: CampaignRecipientStatus.Pending,
      createdAt: input.now,
      updatedAt: input.now,
    });
    await deps.recipientRepository.save(recipient);
  }

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
    execution: campaign.execution
      ? {
          ...campaign.execution,
          preparedAt: undefined,
        }
      : undefined,
    postSummary: campaign.postSummary,
    learnings: campaign.learnings,
  });
  await deps.campaignRepository.update(updated);

  return Object.freeze({
    parse,
    recipientCount: parse.accepted.length,
    matchedCount,
    unmatchedCount,
  });
}

/**
 * Prepare for external_import: promotes persisted Pending (matched) recipients to
 * Queued + DeliveryJobs. Does not parse a file. Leaves status draft.
 */
export async function prepareImportedCampaign(
  input: { campaignId: string; now: string },
  deps: PrepareCampaignFromImportDependencies,
): Promise<PrepareCampaignResult> {
  const campaign = await deps.campaignRepository.getById(input.campaignId.trim());
  if (!campaign) {
    throw new OutreachValidationError(`Campaign not found: ${input.campaignId}`);
  }
  if (campaign.status !== CampaignStatus.Draft) {
    throw new OutreachValidationError("Only draft campaigns can be prepared.");
  }
  if (campaign.recipientSource !== "external_import") {
    throw new OutreachValidationError(
      "Bu kampanya Excel/CSV alıcı kaynağı kullanmıyor. Segment Prepare kullanın.",
    );
  }

  await assertOperationAllowed("OUTREACH_PREPARE", {
    billingProtectionRepository: deps.billingProtectionRepository,
  });

  const campaignId = campaignIdAsString(campaign.id);
  const recipients = await deps.recipientRepository.listByCampaignId(campaignId);
  if (recipients.length === 0) {
    throw new OutreachValidationError(
      "Önce Excel/CSV import edin (Alıcı Kaynağı adımı).",
    );
  }

  const pending = recipients.filter((r) => r.status === CampaignRecipientStatus.Pending);
  if (pending.length === 0) {
    return Object.freeze({
      recipientCount: 0,
      skippedDuplicates: 0,
      totalRecipients: recipients.length,
      targetLimit: Math.max(1, deps.targetLimit ?? deps.config.warmupBatchSize),
    });
  }

  const targetLimit = Math.max(1, deps.targetLimit ?? deps.config.warmupBatchSize);
  const result = await promotePendingRecipientsToJobs(
    {
      campaign,
      now: input.now,
      recipients,
      targetLimit,
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
    importMeta: campaign.importMeta,
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

  return result;
}

/**
 * Legacy one-shot: persist import then prepare (jobs). Prefer importExternalRecipients
 * + prepareImportedCampaign for the Growth Center wizard.
 */
export async function prepareCampaignFromImport(
  input: PrepareCampaignFromImportInput,
  deps: PrepareCampaignFromImportDependencies,
): Promise<PrepareCampaignResult & { parse: OutreachImportParseResult }> {
  const imported = await importExternalRecipients(input, {
    campaignRepository: deps.campaignRepository,
    recipientRepository: deps.recipientRepository,
    institutionRepository: null,
    resolveCatalogMatches: false,
    nextRecipientId: deps.nextRecipientId,
  });

  const result = await prepareImportedCampaign(
    { campaignId: input.campaignId, now: input.now },
    deps,
  );

  return Object.freeze({ ...result, parse: imported.parse });
}
