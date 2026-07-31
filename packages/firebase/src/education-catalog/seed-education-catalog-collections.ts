import {
  EDUCATION_CATALOG_KINDS,
  type EducationCatalogKind,
  educationCatalogCollectionId,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { buildEducationCatalogSeedBundle } from "./education-catalog-seed";
import { FirestoreEducationCatalogMapper } from "./firestore-education-catalog-mapper";
import { FirestoreEducationCatalogRepository } from "./firestore-education-catalog-repository";
import { InMemoryEducationCatalogDocumentStore } from "./in-memory-education-catalog-document-store";

const BATCH_LIMIT = 400;

export type SeedEducationCatalogCollectionsResult = Readonly<{
  readonly collections: readonly string[];
  readonly countsByKind: Readonly<Record<EducationCatalogKind, number>>;
  readonly totalWritten: number;
}>;

/**
 * Upserts education taxonomy catalogs into Firestore. No institutions.
 */
export async function seedEducationCatalogCollections(
  firestore: Firestore,
): Promise<SeedEducationCatalogCollectionsResult> {
  const bundle = buildEducationCatalogSeedBundle();
  const counts = {} as Record<EducationCatalogKind, number>;

  for (const kind of EDUCATION_CATALOG_KINDS) {
    const catalogItems = bundle.itemsByKind[kind];
    counts[kind] = catalogItems.length;
    const collectionId = educationCatalogCollectionId(kind);

    for (let index = 0; index < catalogItems.length; index += BATCH_LIMIT) {
      const batch = firestore.batch();
      const slice = catalogItems.slice(index, index + BATCH_LIMIT);
      for (const item of slice) {
        const ref = firestore
          .collection(collectionId)
          .doc(FirestoreEducationCatalogMapper.docId(item));
        batch.set(ref, FirestoreEducationCatalogMapper.toFirestore(item), { merge: true });
      }
      await batch.commit();
    }
  }

  return Object.freeze({
    collections: Object.freeze(EDUCATION_CATALOG_KINDS.map(educationCatalogCollectionId)),
    countsByKind: Object.freeze(counts),
    totalWritten: bundle.allItems.length,
  });
}

export type SeededEducationCatalogRepositories = Readonly<{
  readonly getRepository: (kind: EducationCatalogKind) => FirestoreEducationCatalogRepository;
}>;

/**
 * In-memory repositories for all education catalog kinds (tests / offline).
 */
export async function createSeededEducationCatalogRepositories(): Promise<SeededEducationCatalogRepositories> {
  const bundle = buildEducationCatalogSeedBundle();
  const repos = new Map<EducationCatalogKind, FirestoreEducationCatalogRepository>();

  for (const kind of EDUCATION_CATALOG_KINDS) {
    const store = new InMemoryEducationCatalogDocumentStore();
    for (const item of bundle.itemsByKind[kind]) {
      await store.upsert(
        FirestoreEducationCatalogMapper.docId(item),
        FirestoreEducationCatalogMapper.toFirestore(item),
      );
    }
    repos.set(kind, new FirestoreEducationCatalogRepository({ kind, store }));
  }

  return Object.freeze({
    getRepository: (kind: EducationCatalogKind) => {
      const repo = repos.get(kind);
      if (!repo) {
        throw new Error(`Missing education catalog repository for ${kind}.`);
      }
      return repo;
    },
  });
}
