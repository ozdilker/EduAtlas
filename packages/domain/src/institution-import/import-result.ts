/**
 * Outcome of a single row after import execution (or dry-run).
 */
export enum ImportRowOutcome {
  /** Written through the repository. */
  Created = "created",
  /** Valid; would be written when not in dry-run. */
  WouldCreate = "would_create",
  /** Skipped: duplicate of an existing or in-file institution. */
  SkippedDuplicate = "skipped_duplicate",
  /** Skipped: validation errors. */
  SkippedInvalid = "skipped_invalid",
  /** Repository write failed. */
  Failed = "failed",
}

/**
 * Aggregate summary of an import run.
 */
export type ImportResult = Readonly<{
  readonly jobId: string;
  readonly dryRun: boolean;
  readonly totalRows: number;
  readonly createdCount: number;
  readonly wouldCreateCount: number;
  readonly duplicateCount: number;
  readonly invalidCount: number;
  readonly failedCount: number;
  readonly completedAt: string;
}>;

export type CreateImportResultInput = {
  jobId: string;
  dryRun: boolean;
  totalRows: number;
  createdCount: number;
  wouldCreateCount: number;
  duplicateCount: number;
  invalidCount: number;
  failedCount: number;
  completedAt: string;
};

export function createImportResult(input: CreateImportResultInput): ImportResult {
  const jobId = input.jobId.trim();
  if (!jobId) {
    throw new Error("ImportResult.jobId is required.");
  }

  const counts = [
    input.totalRows,
    input.createdCount,
    input.wouldCreateCount,
    input.duplicateCount,
    input.invalidCount,
    input.failedCount,
  ];
  if (counts.some((count) => !Number.isInteger(count) || count < 0)) {
    throw new Error("ImportResult counts must be integers >= 0.");
  }
  if (Number.isNaN(Date.parse(input.completedAt))) {
    throw new Error("ImportResult.completedAt must be a valid ISO timestamp.");
  }

  return Object.freeze({
    jobId,
    dryRun: input.dryRun,
    totalRows: input.totalRows,
    createdCount: input.createdCount,
    wouldCreateCount: input.wouldCreateCount,
    duplicateCount: input.duplicateCount,
    invalidCount: input.invalidCount,
    failedCount: input.failedCount,
    completedAt: input.completedAt,
  });
}
