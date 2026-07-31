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
}>;

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
  const rows = await validateImport({ rows: withGeo, now }, {
    institutionRepository: deps.institutionRepository,
    cityRepository: deps.cityRepository,
    districtRepository: deps.districtRepository,
  });

  const job = createImportJob({
    id: buildImportJobId(now),
    fileName: input.fileName,
    sourceFormat: parsed.sourceFormat,
    status: ImportJobStatus.Previewed,
    dryRun: true,
    totalRows: rows.length,
    createdAt: now,
  });

  const importable = rows.filter(
    (item) => item.status === "ready" || item.status === "warning",
  ).length;
  const duplicates = rows.filter((item) => item.status === "duplicate").length;
  const invalid = rows.filter((item) => item.status === "invalid").length;

  const result = createImportResult({
    jobId: job.id,
    dryRun: true,
    totalRows: rows.length,
    createdCount: 0,
    wouldCreateCount: importable,
    duplicateCount: duplicates,
    invalidCount: invalid,
    failedCount: 0,
    completedAt: now,
  });

  return Object.freeze({
    job,
    rows,
    result,
    unknownHeaders: parsed.unknownHeaders,
    sourceId: parsed.sourceId,
  });
}

export function buildImportJobId(now: string): string {
  return `import_${now.replaceAll(/[^0-9]/g, "").slice(0, 17)}`;
}
