import type { Ga4SnapshotRepository } from "@eduatlas/application";
import {
  createFirestoreGa4SnapshotRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

let ga4SnapshotRepositoryPromise: Promise<Ga4SnapshotRepository> | undefined;

export function getGa4SnapshotRepository(): Promise<Ga4SnapshotRepository> {
  if (!ga4SnapshotRepositoryPromise) {
    ga4SnapshotRepositoryPromise = Promise.resolve(
      createFirestoreGa4SnapshotRepository(getAdminFirestore()),
    );
  }
  return ga4SnapshotRepositoryPromise;
}

/** Test helper — clears cached repository. */
export function resetGa4SnapshotRepositoryForTests(): void {
  ga4SnapshotRepositoryPromise = undefined;
}
