import { randomUUID } from "node:crypto";
import type { ObjectStorage, ObjectStoragePutInput } from "@eduatlas/application";
import type { Storage } from "firebase-admin/storage";

/**
 * Firebase Admin Storage adapter for institution media bytes.
 * UI never calls this — only trusted server use cases.
 */
export class FirebaseAdminObjectStorage implements ObjectStorage {
  constructor(
    private readonly storage: Storage,
    private readonly bucketName?: string,
  ) {}

  private bucket() {
    return this.bucketName ? this.storage.bucket(this.bucketName) : this.storage.bucket();
  }

  async put(input: ObjectStoragePutInput) {
    const file = this.bucket().file(input.path);
    const downloadToken = input.publicReadable ? randomUUID() : undefined;

    await file.save(Buffer.from(input.data), {
      contentType: input.contentType,
      resumable: false,
      metadata: {
        contentType: input.contentType,
        cacheControl: "public, max-age=31536000",
        ...(downloadToken
          ? {
              metadata: {
                firebaseStorageDownloadTokens: downloadToken,
              },
            }
          : {}),
      },
    });

    if (input.publicReadable) {
      try {
        await file.makePublic();
      } catch {
        // Uniform bucket-level access / IAM may block ACL; token URL still works.
      }
    }

    return {
      path: input.path,
      url: this.buildUrl(input.path, downloadToken),
    };
  }

  async delete(path: string) {
    try {
      await this.bucket().file(path).delete({ ignoreNotFound: true });
    } catch {
      // ignore missing
    }
  }

  async getUrl(path: string) {
    return this.buildUrl(path);
  }

  private buildUrl(path: string, downloadToken?: string): string {
    const bucket = this.bucket();
    if (downloadToken) {
      const encoded = encodeURIComponent(path);
      return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${downloadToken}`;
    }

    const encoded = encodeURIComponent(path).replaceAll("%2F", "/");
    return `https://storage.googleapis.com/${bucket.name}/${encoded}`;
  }
}

export function createFirebaseAdminObjectStorage(
  storage: Storage,
  bucketName?: string,
): ObjectStorage {
  return new FirebaseAdminObjectStorage(storage, bucketName);
}
