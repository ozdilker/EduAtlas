/**
 * Shared Firebase Storage types for the client Storage Service.
 * Infrastructure-only — no UI bindings.
 */

/** Institution-scoped Storage folders (FIREBASE-ARCHITECTURE §8.1 + cover). */
export type InstitutionStorageFolder =
  | "logo"
  | "cover"
  | "gallery"
  | "documents"
  | "videos";

/** Upload progress reported by resumable uploads (0–100). */
export type StorageUploadProgress = Readonly<{
  readonly bytesTransferred: number;
  readonly totalBytes: number;
  /** Percentage in the inclusive range [0, 100]. */
  readonly progress: number;
}>;

/** Callback invoked as bytes are transferred during upload. */
export type StorageUploadProgressCallback = (progress: StorageUploadProgress) => void;

/** Binary payload accepted by the client Storage Service. */
export type StorageUploadData = Blob | ArrayBuffer | Uint8Array;

/**
 * Upload input. Provide a directory from the path builder plus the original
 * file name; the service generates a unique object name under that directory.
 */
export type StorageUploadInput = Readonly<{
  /** Directory path without trailing slash, e.g. `institutions/{id}/logo`. */
  readonly directory: string;
  /** Original file name (used for extension / sanitization). */
  readonly fileName: string;
  readonly data: StorageUploadData;
  readonly contentType?: string;
  readonly customMetadata?: Readonly<Record<string, string>>;
  readonly onProgress?: StorageUploadProgressCallback;
}>;

export type StorageUploadResult = Readonly<{
  /** Full Storage object path. */
  readonly path: string;
  /** Generated unique file name (not the original). */
  readonly fileName: string;
  /** Download URL after a successful upload. */
  readonly downloadUrl: string;
}>;

/**
 * Generic Storage operations shared across logo, cover, gallery, documents, etc.
 */
export interface StorageService {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(path: string): Promise<void>;
  /**
   * Deletes an object addressed by its Firebase download URL.
   * Useful when only the public URL is persisted (e.g. galleryImages).
   */
  deleteByDownloadUrl(downloadUrl: string): Promise<void>;
  getDownloadUrl(path: string): Promise<string>;
}
