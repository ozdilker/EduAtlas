import path from "node:path";
import type { MediaRepository, ObjectStorage } from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createFirebaseAdminObjectStorage,
  createFirestoreMediaRepository,
  createInMemoryMediaRepository,
  createLocalFilesystemObjectStorage,
  getAdminFirestore,
  getAdminStorage,
} from "@eduatlas/firebase/server";

let mediaRepositoryPromise: Promise<MediaRepository> | undefined;
let objectStoragePromise: Promise<ObjectStorage> | undefined;

function canUseFirebaseBackend(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return false;
  }
  if (shouldUseFirebaseEmulators(env)) {
    return true;
  }
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

function createLocalObjectStorage(): ObjectStorage {
  const rootDir = path.join(process.cwd(), "public", "media");
  return createLocalFilesystemObjectStorage(rootDir, "/media");
}

function preferLocalObjectStorage(): boolean {
  const flag = process.env.EDUATLAS_LOCAL_OBJECT_STORAGE?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

async function resolveObjectStorage(): Promise<ObjectStorage> {
  if (preferLocalObjectStorage()) {
    return createLocalObjectStorage();
  }

  if (!canUseFirebaseBackend()) {
    return createLocalObjectStorage();
  }

  const bucketName =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const adminStorage = getAdminStorage();
  const firebaseStorage = createFirebaseAdminObjectStorage(adminStorage, bucketName);

  if (!bucketName?.trim()) {
    console.warn(
      "[eduatlas] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is missing; using local public/media storage.",
    );
    return createLocalObjectStorage();
  }

  try {
    const [exists] = await adminStorage.bucket(bucketName).exists();
    if (!exists) {
      console.warn(
        `[eduatlas] Storage bucket "${bucketName}" does not exist (enable Cloud Storage / Blaze billing). Falling back to local public/media.`,
      );
      return createLocalObjectStorage();
    }
    return firebaseStorage;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[eduatlas] Storage bucket probe failed (${message}). Falling back to local public/media.`,
    );
    return createLocalObjectStorage();
  }
}

/**
 * Media metadata repository — Firestore when configured, otherwise in-memory.
 */
export function getMediaRepository(): Promise<MediaRepository> {
  if (!mediaRepositoryPromise) {
    mediaRepositoryPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreMediaRepository(getAdminFirestore())
        : createInMemoryMediaRepository(),
    );
  }
  return mediaRepositoryPromise;
}

/**
 * Binary ObjectStorage — Firebase Admin Storage when the bucket exists,
 * otherwise local `public/media` so owner uploads still work in development.
 */
export function getObjectStorage(): Promise<ObjectStorage> {
  if (!objectStoragePromise) {
    objectStoragePromise = resolveObjectStorage();
  }
  return objectStoragePromise;
}

export function resetMediaRepositoriesForTests(): void {
  mediaRepositoryPromise = undefined;
  objectStoragePromise = undefined;
}
