import type { LeadRepository } from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createFirestoreLeadRepository,
  FirestoreLeadRepository,
  getAdminFirestore,
  InMemoryLeadDocumentStore,
} from "@eduatlas/firebase/server";
import { getOwnerDemoInstitutionId } from "./owner-demo-context";
import { createOwnerDemoLeadDocuments } from "./owner-demo-leads";

let repositoryPromise: Promise<LeadRepository> | undefined;

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

async function createSeededLeadRepository(): Promise<LeadRepository> {
  const store = new InMemoryLeadDocumentStore();
  const docs = createOwnerDemoLeadDocuments(getOwnerDemoInstitutionId());

  for (const doc of docs) {
    await store.create(doc.id, doc.data);
  }

  return new FirestoreLeadRepository({ store });
}

async function getLeadDataAccess(): Promise<LeadRepository> {
  if (!repositoryPromise) {
    repositoryPromise = canUseFirestoreBackend()
      ? Promise.resolve(createFirestoreLeadRepository(getAdminFirestore()))
      : createSeededLeadRepository();
  }

  return repositoryPromise;
}

/**
 * Returns the LeadRepository used by server routes.
 * Prefers Firestore Admin; falls back to seeded in-memory store for local/CI.
 */
export function getLeadRepository(): Promise<LeadRepository> {
  return getLeadDataAccess();
}

/**
 * Test helper to clear the repository singleton.
 */
export function resetLeadRepositoryForTests(): void {
  repositoryPromise = undefined;
}
