import type { SeoActionTaskRepository } from "@eduatlas/application";
import {
  createFirestoreSeoActionTaskRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

let seoActionTaskRepositoryPromise: Promise<SeoActionTaskRepository> | undefined;

export function getSeoActionTaskRepository(): Promise<SeoActionTaskRepository> {
  if (!seoActionTaskRepositoryPromise) {
    seoActionTaskRepositoryPromise = Promise.resolve(
      createFirestoreSeoActionTaskRepository(getAdminFirestore()),
    );
  }
  return seoActionTaskRepositoryPromise;
}

/** Test helper — clears cached repository. */
export function resetSeoActionTaskRepositoryForTests(): void {
  seoActionTaskRepositoryPromise = undefined;
}
