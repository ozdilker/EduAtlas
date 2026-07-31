import type { ClaimRequestRepository } from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createFirestoreClaimRequestRepository,
  FirestoreClaimRequestRepository,
  getAdminFirestore,
  InMemoryClaimRequestDocumentStore,
} from "@eduatlas/firebase/server";

let repositoryPromise: Promise<ClaimRequestRepository> | undefined;

function canUseFirestoreBackend(): boolean {
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

async function createSeededClaimRequestRepository(): Promise<ClaimRequestRepository> {
  return new FirestoreClaimRequestRepository({
    store: new InMemoryClaimRequestDocumentStore(),
  });
}

async function getClaimRequestDataAccess(): Promise<ClaimRequestRepository> {
  if (!repositoryPromise) {
    repositoryPromise = canUseFirestoreBackend()
      ? Promise.resolve(createFirestoreClaimRequestRepository(getAdminFirestore()))
      : createSeededClaimRequestRepository();
  }

  return repositoryPromise;
}

/**
 * Returns the ClaimRequestRepository used by server routes.
 * Prefers Firestore Admin; falls back to in-memory store for local/CI.
 */
export function getClaimRequestRepository(): Promise<ClaimRequestRepository> {
  return getClaimRequestDataAccess();
}

/**
 * Test helper to clear the repository singleton.
 */
export function resetClaimRequestRepositoryForTests(): void {
  repositoryPromise = undefined;
}
