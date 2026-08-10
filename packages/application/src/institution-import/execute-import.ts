import {
  createImportJob,
  createImportResult,
  type ImportDataSourceId,
  type ImportJob,
  ImportJobStatus,
  type ImportResult,
  ImportRowOutcome,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";
import type { CityRepository } from "../geography/city-repository";
import type { DistrictRepository } from "../geography/district-repository";
import { isDuplicateInstitutionError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { resolveImportGeography } from "./geography/resolve-import-geography";
import { parseImportFile } from "./import-file-parser";
import { normalizeInstitutionImportRows } from "./normalize/normalize-import-row";
import { buildImportJobId } from "./preview-import";
import { buildImportCandidate, type ValidatedImportRow, validateImport } from "./validate-import";

export type ExecuteImportInput = Readonly<{
  readonly fileName: string;
  readonly content: Uint8Array;
  /** When true, validates everything but writes nothing. */
  readonly dryRun: boolean;
  readonly now?: string;
  readonly jobId?: string;
}>;

export type ExecuteImportProgress = Readonly<{
  readonly phase: "validating" | "writing" | "done";
  readonly totalRows: number;
  readonly processedRows: number;
  readonly createdCount: number;
  readonly duplicateCount: number;
  readonly invalidCount: number;
  readonly failedCount: number;
  readonly message: string;
}>;

export type ExecuteImportDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
  readonly cityRepository: CityRepository;
  readonly districtRepository: DistrictRepository;
  readonly onProgress?: (progress: ExecuteImportProgress) => void | Promise<void>;
  /** Optional Phase 1 billing circuit breaker — fail-open when omitted. */
  readonly billingProtectionRepository?: import("../billing-protection").BillingProtectionRepository | null;
}>;

export type ExecutedImportRow = Readonly<{
  readonly validated: ValidatedImportRow;
  readonly outcome: ImportRowOutcome;
  readonly errorMessage?: string;
}>;

export type ExecuteImportResult = Readonly<{
  readonly job: ImportJob;
  readonly rows: readonly ExecutedImportRow[];
  readonly result: ImportResult;
  readonly unknownHeaders: readonly string[];
  readonly sourceId: ImportDataSourceId;
}>;

const WRITE_BATCH_SIZE = 25;
const BATCH_PAUSE_MS = 400;
const MAX_RETRIES = 6;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "8" ||
    /RESOURCE_EXHAUSTED|Quota exceeded|Too many requests|429/i.test(`${code} ${message}`)
  );
}

/**
 * Full import pipeline: parse → adapter → normalize → geo → validate → (optional) write.
 * Writes in small batches with backoff to survive Firestore free-tier rate limits.
 * @throws {ImportFileError} when the file cannot be parsed
 */
export async function executeImport(
  input: ExecuteImportInput,
  deps: ExecuteImportDependencies,
): Promise<ExecuteImportResult> {
  const now = input.now ?? new Date().toISOString();
  const report = async (progress: ExecuteImportProgress) => {
    await deps.onProgress?.(progress);
  };

  await report({
    phase: "validating",
    totalRows: 0,
    processedRows: 0,
    createdCount: 0,
    duplicateCount: 0,
    invalidCount: 0,
    failedCount: 0,
    message: "Dosya doğrulanıyor…",
  });

  const parsed = await parseImportFile({ fileName: input.fileName, content: input.content });
  const normalized = normalizeInstitutionImportRows(parsed.rows);
  const withGeo = await resolveImportGeography(normalized, {
    cityRepository: deps.cityRepository,
    districtRepository: deps.districtRepository,
  });
  const validated = await validateImport({ rows: withGeo, now }, {
    institutionRepository: deps.institutionRepository,
    cityRepository: deps.cityRepository,
    districtRepository: deps.districtRepository,
    billingProtectionRepository: deps.billingProtectionRepository,
  });

  const rows: ExecutedImportRow[] = [];
  let created = 0;
  let wouldCreate = 0;
  let duplicates = 0;
  let invalid = 0;
  let failed = 0;
  let processed = 0;

  const importable: ValidatedImportRow[] = [];

  for (const item of validated) {
    if (item.status === "invalid") {
      invalid += 1;
      processed += 1;
      rows.push(Object.freeze({ validated: item, outcome: ImportRowOutcome.SkippedInvalid }));
      continue;
    }

    if (item.status === "duplicate") {
      duplicates += 1;
      processed += 1;
      rows.push(Object.freeze({ validated: item, outcome: ImportRowOutcome.SkippedDuplicate }));
      continue;
    }

    if (input.dryRun) {
      wouldCreate += 1;
      processed += 1;
      rows.push(Object.freeze({ validated: item, outcome: ImportRowOutcome.WouldCreate }));
      continue;
    }

    importable.push(item);
  }

  await report({
    phase: input.dryRun ? "done" : "writing",
    totalRows: validated.length,
    processedRows: processed,
    createdCount: created,
    duplicateCount: duplicates,
    invalidCount: invalid,
    failedCount: failed,
    message: input.dryRun
      ? "Deneme tamamlandı."
      : `${importable.length} satır yazılacak…`,
  });

  if (!input.dryRun && importable.length > 0) {
    for (let offset = 0; offset < importable.length; offset += WRITE_BATCH_SIZE) {
      const chunk = importable.slice(offset, offset + WRITE_BATCH_SIZE);
      const candidates: Array<{ item: ValidatedImportRow; institution: Institution }> = [];

      for (const item of chunk) {
        candidates.push({
          item,
          institution: buildImportCandidate(item.row, item.slugPreview, now, {
            latitude: parseNumberOrUndefined(item.row.latitude),
            longitude: parseNumberOrUndefined(item.row.longitude),
          }),
        });
      }

      const writeResult = await writeChunkWithRetry(
        candidates.map((entry) => entry.institution),
        deps.institutionRepository,
      );

      for (const entry of candidates) {
        const id = institutionIdAsString(entry.institution.id);
        if (writeResult.savedIds.has(id)) {
          created += 1;
          rows.push(Object.freeze({ validated: entry.item, outcome: ImportRowOutcome.Created }));
        } else if (writeResult.duplicateIds.has(id)) {
          duplicates += 1;
          rows.push(
            Object.freeze({
              validated: entry.item,
              outcome: ImportRowOutcome.SkippedDuplicate,
              errorMessage: "Bu kurum zaten kayıtlı.",
            }),
          );
        } else {
          failed += 1;
          rows.push(
            Object.freeze({
              validated: entry.item,
              outcome: ImportRowOutcome.Failed,
              errorMessage: writeResult.errorMessage ?? "Yazma başarısız",
            }),
          );
        }
        processed += 1;
      }

      await report({
        phase: "writing",
        totalRows: validated.length,
        processedRows: processed,
        createdCount: created,
        duplicateCount: duplicates,
        invalidCount: invalid,
        failedCount: failed,
        message: `Yazılıyor: ${processed} / ${validated.length}`,
      });

      if (offset + WRITE_BATCH_SIZE < importable.length) {
        await sleep(BATCH_PAUSE_MS);
      }
    }
  }

  // Keep row order aligned with source file numbers.
  rows.sort((left, right) => left.validated.row.rowNumber - right.validated.row.rowNumber);

  const job = createImportJob({
    id: input.jobId ?? buildImportJobId(now),
    fileName: input.fileName,
    sourceFormat: parsed.sourceFormat,
    status: input.dryRun ? ImportJobStatus.Previewed : ImportJobStatus.Completed,
    dryRun: input.dryRun,
    totalRows: validated.length,
    createdAt: now,
  });

  const result = createImportResult({
    jobId: job.id,
    dryRun: input.dryRun,
    totalRows: validated.length,
    createdCount: created,
    wouldCreateCount: wouldCreate,
    duplicateCount: duplicates,
    invalidCount: invalid,
    failedCount: failed,
    completedAt: now,
  });

  await report({
    phase: "done",
    totalRows: validated.length,
    processedRows: validated.length,
    createdCount: created,
    duplicateCount: duplicates,
    invalidCount: invalid,
    failedCount: failed,
    message: input.dryRun
      ? "Deneme tamamlandı."
      : `İçe aktarma tamamlandı: ${created} eklendi.`,
  });

  return Object.freeze({
    job,
    rows: Object.freeze(rows),
    result,
    unknownHeaders: parsed.unknownHeaders,
    sourceId: parsed.sourceId,
  });
}

type ChunkWriteResult = {
  savedIds: Set<string>;
  duplicateIds: Set<string>;
  errorMessage?: string;
};

function institutionKey(institution: Institution): string {
  return institutionIdAsString(institution.id);
}

async function writeChunkWithRetry(
  institutions: readonly Institution[],
  repository: InstitutionRepository,
): Promise<ChunkWriteResult> {
  const savedIds = new Set<string>();
  const duplicateIds = new Set<string>();
  let errorMessage: string | undefined;
  let pending = [...institutions];

  for (let attempt = 0; attempt < MAX_RETRIES && pending.length > 0; attempt += 1) {
    try {
      if (repository.saveMany) {
        const saved = await repository.saveMany(pending);
        for (const institution of saved) {
          savedIds.add(institutionKey(institution));
        }
        // saveMany omits duplicates on the ALREADY_EXISTS fallback path.
        for (const institution of pending) {
          const id = institutionKey(institution);
          if (!savedIds.has(id)) {
            duplicateIds.add(id);
          }
        }
        pending = [];
        break;
      }

      for (const institution of pending) {
        try {
          await repository.save(institution);
          savedIds.add(institutionKey(institution));
        } catch (error) {
          if (isDuplicateInstitutionError(error)) {
            duplicateIds.add(institutionKey(institution));
            continue;
          }
          throw error;
        }
      }
      pending = [];
      break;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      if (!isQuotaError(error)) {
        // Non-quota: try one-by-one for this chunk.
        for (const institution of pending) {
          const id = institutionKey(institution);
          if (savedIds.has(id) || duplicateIds.has(id)) {
            continue;
          }
          try {
            await repository.save(institution);
            savedIds.add(id);
          } catch (itemError) {
            if (isDuplicateInstitutionError(itemError)) {
              duplicateIds.add(id);
            } else if (isQuotaError(itemError)) {
              errorMessage = itemError instanceof Error ? itemError.message : String(itemError);
              break;
            } else {
              errorMessage = itemError instanceof Error ? itemError.message : String(itemError);
            }
          }
        }
        pending = pending.filter(
          (institution) =>
            !savedIds.has(institutionKey(institution)) &&
            !duplicateIds.has(institutionKey(institution)),
        );
        if (pending.length === 0 || !isQuotaError(error)) {
          break;
        }
      }
      await sleep(1000 * 2 ** attempt);
    }
  }

  return { savedIds, duplicateIds, errorMessage };
}

function parseNumberOrUndefined(raw: string): number | undefined {
  if (!raw) {
    return undefined;
  }
  const value = Number(raw.replace(",", "."));
  return Number.isNaN(value) ? undefined : value;
}
