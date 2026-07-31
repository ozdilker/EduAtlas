/**
 * Binary object storage port (SYSTEM-ARCHITECTURE ObjectStorage).
 * Infrastructure adapters implement this — no Firebase SDK in this package.
 */
export type ObjectStoragePutInput = Readonly<{
  readonly path: string;
  readonly contentType: string;
  readonly data: Uint8Array;
  /** When true, the object is intended for public media delivery. */
  readonly publicReadable?: boolean;
}>;

export type ObjectStoragePutResult = Readonly<{
  readonly path: string;
  readonly url: string;
}>;

export interface ObjectStorage {
  /**
   * Writes bytes to the given storage path and returns a delivery URL.
   */
  put(input: ObjectStoragePutInput): Promise<ObjectStoragePutResult>;

  /**
   * Deletes an object if it exists (idempotent).
   */
  delete(path: string): Promise<void>;

  /**
   * Resolves a public (or signed) URL for an existing path without uploading.
   */
  getUrl(path: string): Promise<string>;
}
