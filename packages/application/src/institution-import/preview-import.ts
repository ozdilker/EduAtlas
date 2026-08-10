import {
  createImportJob,
  createImportResult,
  type ImportDataSourceId,
  type ImportJob,
  ImportJobStatus,
  type ImportResult,
} from "@eduatlas/domain";
import type { CityRepository } from "../geography/city-repository";
import type { DistrictRepository } from "../geography/district-repository";
import { resolveImportGeography } from "./geography/resolve-import-geography";
import { parseImportFile } from "./import-file-parser";
import { normalizeInstitutionImportRows } from "./normalize/normalize-import-row";
import type { ValidateImportDependencies } from "./validate-import";
import { type ValidatedImportRow, validateImport } from "./validate-import";

export type PreviewImportInput = Readonly<{
  readonly fileName: string;
  readonly content: Uint8Array;
  readonly now?: string;
}>;

export type PreviewImportDependencies = ValidateImportDependencies &
  Readonly<{
    readonly cityRepository: CityRepository;
    readonly districtRepository: DistrictRepository;
  }>;

export type PreviewImportResult = Readonly<{
  readonly job: ImportJob;
  readonly rows: readonly ValidatedImportRow[];
  /** Dry-run summary: nothing has been written. */
  readonly result: ImportResult;
  readonly unknownHeaders: readonly string[];
  readonly sourceId: ImportDataSourceId;
  /** True when quality scoring was skipped to keep large MEB previews alive. */
  readonly qualityPreviewSkipped: boolean;
  /** True when Firestore catalog duplicate scan was skipped for the same reason. */
  readonly existingDuplicateScanSkipped: boolean;
}>;

/** Above this row count, preview skips per-row quality scoring. */
export const LARGE_IMPORT_SKIP_QUALITY_ROWS = 400;
/**
 * Above this row count, preview skips loading the full institution catalog for
 * duplicate detection (in-file duplicates still apply). Execute still scans.
 */
export const LARGE_IMPORT_SKIP_EXISTING_SCAN_ROWS = 1500;
/** Max validated rows kept on the preview result (full counts still in `result`). */
export const PREVIEW_DISPLAY_ROWS_MAX = 200;

const DISPLAY_STATUS_PRIORITY: Readonly<Record<string, number>> = Object.freeze({
  invalid: 0,
  warning: 1,
  duplicate: 2,
  ready: 3,
});

function samplePreviewRows(
  rows: readonly ValidatedImportRow[],
  limit: number = PREVIEW_DISPLAY_ROWS_MAX,
): readonly ValidatedImportRow[] {
  if (rows.length <= limit) {
    return rows;
  }
  const ranked = [...rows].sort((a, b) => {
    const pa = DISPLAY_STATUS_PRIORITY[a.status] ?? 99;
    const pb = DISPLAY_STATUS_PRIORITY[b.status] ?? 99;
    return pa - pb;
  });
  return ranked.slice(0, limit);
}

/**
 * Parses and validates an import file without writing anything (dry-run).
 * Pipeline: parse → adapter → normalize → geo resolve → validate.
 * @throws {ImportFileError} when the file cannot be parsed
 */
export async function previewImport(
  input: PreviewImportInput,
  deps: PreviewImportDependencies,
): Promise<PreviewImportResult> {
  const now = input.now ?? new Date().toISOString();
  const parsed = await parseImportFile({ fileName: input.fileName, content: input.content });
  const normalized = normalizeInstitutionImportRows(parsed.rows);
  const withGeo = await resolveImportGeography(normalized, {
    cityRepository: deps.cityRepository,
    districtRepository: deps.districtRepository,
  });
  const skipQualityPreview = withGeo.length >= LARGE_IMPORT_SKIP_QUALITY_ROWS;
  const skipExistingDuplicateScan = withGeo.length >= LARGE_IMPORT_SKIP_EXISTING_SCAN_ROWS;
  const validated = await validateImport(
    {
      rows: withGeo,
      now,
      skipQualityPreview,
      skipExistingDuplicateScan,
    },
    {
      institutionRepository: deps.institutionRepository,
      cityRepository: deps.cityRepository,
      districtRepository: deps.districtRepository,
      billingProtectionRepository: deps.billingProtectionRepository,
    },
  );

  const job = createImportJob({
    id: buildImportJobId(now),
    fileName: input.fileName,
    sourceFormat: parsed.sourceFormat,
    status: ImportJobStatus.Previewed,
    dryRun: true,
    totalRows: validated.length,
    createdAt: now,
  });

  let importable = 0;
  let duplicates = 0;
  let invalid = 0;
  for (const item of validated) {
    if (item.status === "ready" || item.status === "warning") {
      importable += 1;
    } else if (item.status === "duplicate") {
      duplicates += 1;
    } else if (item.status === "invalid") {
      invalid += 1;
    }
  }

  const result = createImportResult({
    jobId: job.id,
    dryRun: true,
    totalRows: validated.length,
    createdCount: 0,
    wouldCreateCount: importable,
    duplicateCount: duplicates,
    invalidCount: invalid,
    failedCount: 0,
    completedAt: now,
  });

  // Drop the full validated array from the return path — only a UI sample remains.
  const rows = samplePreviewRows(validated);

  return Object.freeze({
    job,
    rows,
    result,
    unknownHeaders: parsed.unknownHeaders,
    sourceId: parsed.sourceId,
    qualityPreviewSkipped: skipQualityPreview,
    existingDuplicateScanSkipped: skipExistingDuplicateScan,
  });
}

export function buildImportJobId(now: string): string {
  return `import_${now.replaceAll(/[^0-9]/g, "").slice(0, 17)}`;
}
