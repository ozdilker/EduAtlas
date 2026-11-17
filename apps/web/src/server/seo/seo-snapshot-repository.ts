import type { SeoSnapshotRepository } from "@eduatlas/application";
import {
  createFirestoreSeoSnapshotRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

let seoSnapshotRepositoryPromise: Promise<SeoSnapshotRepository> | undefined;

export function getSeoSnapshotRepository(): Promise<SeoSnapshotRepository> {
  if (!seoSnapshotRepositoryPromise) {
    seoSnapshotRepositoryPromise = Promise.resolve(
      createFirestoreSeoSnapshotRepository(getAdminFirestore()),
    );
  }
  return seoSnapshotRepositoryPromise;
}

/** Test helper — clears cached repository. */
export function resetSeoSnapshotRepositoryForTests(): void {
  seoSnapshotRepositoryPromise = undefined;
}
