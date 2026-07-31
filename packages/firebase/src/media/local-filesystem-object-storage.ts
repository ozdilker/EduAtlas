import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ObjectStorage, ObjectStoragePutInput } from "@eduatlas/application";

/**
 * Dev/local ObjectStorage — writes under a public directory so URLs are browsable.
 * Used when Firebase Storage bucket is unavailable (e.g. billing not enabled).
 */
export class LocalFilesystemObjectStorage implements ObjectStorage {
  constructor(
    private readonly rootDir: string,
    private readonly publicBasePath: string,
  ) {}

  private absolutePath(objectPath: string): string {
    const normalized = objectPath.replace(/^\/+/, "").replaceAll("\\", "/");
    if (!normalized || normalized.includes("..")) {
      throw new Error("Geçersiz depolama yolu.");
    }
    return path.join(this.rootDir, ...normalized.split("/"));
  }

  async put(input: ObjectStoragePutInput) {
    const absolute = this.absolutePath(input.path);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, Buffer.from(input.data));
    const urlPath = `${this.publicBasePath.replace(/\/+$/, "")}/${input.path.replace(/^\/+/, "")}`;
    return { path: input.path, url: urlPath };
  }

  async delete(objectPath: string) {
    try {
      await unlink(this.absolutePath(objectPath));
    } catch {
      // ignore missing
    }
  }

  async getUrl(objectPath: string) {
    return `${this.publicBasePath.replace(/\/+$/, "")}/${objectPath.replace(/^\/+/, "")}`;
  }
}

export function createLocalFilesystemObjectStorage(
  rootDir: string,
  publicBasePath = "/media",
): ObjectStorage {
  return new LocalFilesystemObjectStorage(rootDir, publicBasePath);
}
