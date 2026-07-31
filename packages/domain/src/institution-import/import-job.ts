import type { ImportSourceFormat } from "./import-source-format";

/**
 * Lifecycle of an import job.
 */
export enum ImportJobStatus {
  /** Parsed and validated, awaiting execution (preview / dry-run). */
  Previewed = "previewed",
  /** Rows written through the repository. */
  Completed = "completed",
  /** Parsing or execution failed as a whole. */
  Failed = "failed",
}

/**
 * A single admin-triggered import run (one uploaded file).
 */
export type ImportJob = Readonly<{
  readonly id: string;
  readonly fileName: string;
  readonly sourceFormat: ImportSourceFormat;
  readonly status: ImportJobStatus;
  readonly dryRun: boolean;
  readonly totalRows: number;
  readonly createdAt: string;
}>;

export type CreateImportJobInput = {
  id: string;
  fileName: string;
  sourceFormat: ImportSourceFormat;
  status?: ImportJobStatus;
  dryRun: boolean;
  totalRows: number;
  createdAt: string;
};

export function createImportJob(input: CreateImportJobInput): ImportJob {
  const id = input.id.trim();
  const fileName = input.fileName.trim();

  if (!id) {
    throw new Error("ImportJob.id is required.");
  }
  if (!fileName) {
    throw new Error("ImportJob.fileName is required.");
  }
  if (!Number.isInteger(input.totalRows) || input.totalRows < 0) {
    throw new Error("ImportJob.totalRows must be an integer >= 0.");
  }
  if (Number.isNaN(Date.parse(input.createdAt))) {
    throw new Error("ImportJob.createdAt must be a valid ISO timestamp.");
  }

  return Object.freeze({
    id,
    fileName,
    sourceFormat: input.sourceFormat,
    status: input.status ?? ImportJobStatus.Previewed,
    dryRun: input.dryRun,
    totalRows: input.totalRows,
    createdAt: input.createdAt,
  });
}
