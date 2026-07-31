import type { InstitutionRepository, InstitutionSearchRepository } from "@eduatlas/application";
import { FirestoreInstitutionRepository } from "../institutions/firestore-institution-repository";
import { InMemoryInstitutionDocumentStore } from "../institutions/in-memory-institution-document-store";
import { seedInstitutionDocumentStore } from "./seed-loader";

/**
 * Empty in-memory institution repository — used in production/runtime so dummy
 * seeds never appear in public search or admin queues.
 */
export async function createEmptyInstitutionRepository(): Promise<
  InstitutionRepository & InstitutionSearchRepository
> {
  const store = new InMemoryInstitutionDocumentStore();
  return new FirestoreInstitutionRepository({ store });
}

/**
 * Creates an in-memory InstitutionRepository + search port preloaded with the development seed dataset.
 * Intended for tests and optional local demos (`EDUATLAS_USE_SEED_INSTITUTIONS=true`).
 */
export async function createSeededInstitutionRepository(): Promise<
  InstitutionRepository & InstitutionSearchRepository
> {
  const store = new InMemoryInstitutionDocumentStore();
  await seedInstitutionDocumentStore(store);
  return new FirestoreInstitutionRepository({ store });
}
