import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CACHE_DIR = join(tmpdir(), "eduatlas-import-uploads");
const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_BYTES = 25 * 1024 * 1024;

export type CachedImportUpload = Readonly<{
  readonly token: string;
  readonly fileName: string;
  readonly content: Uint8Array;
}>;

type UploadMeta = {
  fileName: string;
  createdAt: number;
  byteLength: number;
};

function metaPath(token: string): string {
  return join(CACHE_DIR, `${token}.json`);
}

function dataPath(token: string): string {
  return join(CACHE_DIR, `${token}.bin`);
}

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

/**
 * Stores an uploaded import file for a later “İçe aktar” submit
 * (HTML file inputs are cleared after the preview server action).
 */
export async function storeImportUpload(
  fileName: string,
  content: Uint8Array,
): Promise<string> {
  if (content.byteLength === 0) {
    throw new Error("Boş dosya önbelleğe alınamaz.");
  }
  if (content.byteLength > MAX_BYTES) {
    throw new Error("Dosya 25 MB sınırını aşıyor.");
  }

  await ensureCacheDir();
  const token = randomUUID();
  const meta: UploadMeta = {
    fileName,
    createdAt: Date.now(),
    byteLength: content.byteLength,
  };
  await writeFile(metaPath(token), JSON.stringify(meta), "utf8");
  await writeFile(dataPath(token), content);
  return token;
}

/**
 * Reads a previously stored import upload. Returns null when missing/expired.
 */
export async function getImportUpload(token: string): Promise<CachedImportUpload | null> {
  const safe = token.trim();
  if (!safe || !/^[0-9a-f-]{36}$/i.test(safe)) {
    return null;
  }

  try {
    const metaRaw = await readFile(metaPath(safe), "utf8");
    const meta = JSON.parse(metaRaw) as UploadMeta;
    if (!meta.fileName || !meta.createdAt) {
      return null;
    }
    if (Date.now() - meta.createdAt > TTL_MS) {
      await deleteImportUpload(safe);
      return null;
    }
    const content = new Uint8Array(await readFile(dataPath(safe)));
    return { token: safe, fileName: meta.fileName, content };
  } catch {
    return null;
  }
}

/**
 * Deletes a cached upload (best-effort).
 */
export async function deleteImportUpload(token: string): Promise<void> {
  const safe = token.trim();
  if (!safe) {
    return;
  }
  await Promise.allSettled([unlink(metaPath(safe)), unlink(dataPath(safe))]);
}
