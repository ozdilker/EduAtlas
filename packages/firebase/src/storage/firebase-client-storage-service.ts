import {
  deleteObject,
  type FirebaseStorage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadMetadata,
} from "firebase/storage";
import { mapStorageError, StorageServiceError } from "./errors";
import type { StorageService, StorageUploadInput, StorageUploadResult } from "./types";
import { createUniqueStorageFileName, joinStoragePath } from "./unique-file-name";

/**
 * Client SDK Storage adapter with resumable upload + progress.
 * Reuses the shared Firebase app via an injected FirebaseStorage instance.
 */
export class FirebaseClientStorageService implements StorageService {
  constructor(private readonly storage: FirebaseStorage) {}

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const fileName = createUniqueStorageFileName(input.fileName);
    const path = joinStoragePath(input.directory, fileName);
    const objectRef = ref(this.storage, path);

    const metadata: UploadMetadata = {};
    if (input.contentType) {
      metadata.contentType = input.contentType;
    }
    if (input.customMetadata) {
      metadata.customMetadata = { ...input.customMetadata };
    }

    const task = uploadBytesResumable(objectRef, input.data, metadata);

    try {
      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            if (!input.onProgress) {
              return;
            }

            const totalBytes = snapshot.totalBytes;
            const bytesTransferred = snapshot.bytesTransferred;
            const progress =
              totalBytes > 0 ? Math.min(100, Math.round((bytesTransferred / totalBytes) * 100)) : 0;

            input.onProgress({
              bytesTransferred,
              totalBytes,
              progress,
            });
          },
          (error) => {
            reject(mapStorageError(error));
          },
          () => {
            resolve();
          },
        );
      });

      const downloadUrl = await getDownloadURL(task.snapshot.ref);

      return Object.freeze({
        path,
        fileName,
        downloadUrl,
      });
    } catch (error) {
      throw mapStorageError(error);
    }
  }

  async delete(path: string): Promise<void> {
    const trimmed = path.trim();
    if (!trimmed) {
      throw new StorageServiceError(
        "STORAGE_INVALID_ARGUMENT",
        "Dosya yolu veya içeriği geçersiz.",
      );
    }

    try {
      await deleteObject(ref(this.storage, trimmed));
    } catch (error) {
      const mapped = mapStorageError(error);
      // Idempotent delete: missing objects are treated as success.
      if (mapped.code === "STORAGE_NOT_FOUND") {
        return;
      }
      throw mapped;
    }
  }

  async deleteByDownloadUrl(downloadUrl: string): Promise<void> {
    const trimmed = downloadUrl.trim();
    if (!trimmed) {
      throw new StorageServiceError(
        "STORAGE_INVALID_ARGUMENT",
        "Dosya yolu veya içeriği geçersiz.",
      );
    }

    try {
      await deleteObject(ref(this.storage, trimmed));
    } catch (error) {
      const mapped = mapStorageError(error);
      if (mapped.code === "STORAGE_NOT_FOUND") {
        return;
      }
      throw mapped;
    }
  }

  async getDownloadUrl(path: string): Promise<string> {
    const trimmed = path.trim();
    if (!trimmed) {
      throw new StorageServiceError(
        "STORAGE_INVALID_ARGUMENT",
        "Dosya yolu veya içeriği geçersiz.",
      );
    }

    try {
      return await getDownloadURL(ref(this.storage, trimmed));
    } catch (error) {
      throw mapStorageError(error);
    }
  }
}

export function createFirebaseClientStorageService(storage: FirebaseStorage): StorageService {
  return new FirebaseClientStorageService(storage);
}
