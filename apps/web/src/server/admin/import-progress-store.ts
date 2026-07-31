import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CACHE_DIR = join(tmpdir(), "eduatlas-import-progress");

export type ImportProgressSnapshot = Readonly<{
  readonly jobId: string;
  readonly phase: "queued" | "validating" | "writing" | "done" | "error";
  readonly fileName: string;
  readonly totalRows: number;
  readonly processedRows: number;
  readonly createdCount: number;
  readonly duplicateCount: number;
  readonly invalidCount: number;
  readonly failedCount: number;
  readonly message: string;
  readonly updatedAt: number;
}>;

function progressPath(jobId: string): string {
  return join(CACHE_DIR, `${jobId}.json`);
}

async function ensureDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

/**
 * Writes import progress for client polling (real-time loading bar).
 */
export async function writeImportProgress(snapshot: ImportProgressSnapshot): Promise<void> {
  const safe = snapshot.jobId.trim();
  if (!safe || !/^[0-9a-f-]{36}$/i.test(safe)) {
    return;
  }
  await ensureDir();
  await writeFile(progressPath(safe), JSON.stringify(snapshot), "utf8");
}

/**
 * Reads import progress for a job id.
 */
export async function readImportProgress(jobId: string): Promise<ImportProgressSnapshot | null> {
  const safe = jobId.trim();
  if (!safe || !/^[0-9a-f-]{36}$/i.test(safe)) {
    return null;
  }
  try {
    const raw = await readFile(progressPath(safe), "utf8");
    return JSON.parse(raw) as ImportProgressSnapshot;
  } catch {
    return null;
  }
}

/**
 * Best-effort cleanup after import completes.
 */
export async function deleteImportProgress(jobId: string): Promise<void> {
  const safe = jobId.trim();
  if (!safe) {
    return;
  }
  await Promise.allSettled([unlink(progressPath(safe))]);
}
