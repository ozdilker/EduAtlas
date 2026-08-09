import type {
  InstitutionAdminListFilters,
  InstitutionAdminListPageInput,
  InstitutionListOptions,
  InstitutionRepository,
  InstitutionSearchQuery,
  InstitutionSearchRepository,
} from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import type { Institution, InstitutionId } from "@eduatlas/domain";
import { requestCacheAsync } from "@eduatlas/firebase/cache";
import {
  createEmptyInstitutionRepository,
  createFirestoreInstitutionRepository,
  createSeededInstitutionRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

type InstitutionDataAccess = InstitutionRepository & InstitutionSearchRepository;

let repositoryPromise: Promise<InstitutionDataAccess> | undefined;

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

function shouldUseSeedInstitutions(): boolean {
  const flag = process.env.EDUATLAS_USE_SEED_INSTITUTIONS?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function isQuotaOrUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "8" ||
    /RESOURCE_EXHAUSTED|Quota exceeded|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(`${code} ${message}`)
  );
}

async function createLocalInstitutionDataAccess(): Promise<InstitutionDataAccess> {
  if (shouldUseSeedInstitutions()) {
    return createSeededInstitutionRepository();
  }
  return createEmptyInstitutionRepository();
}

/** After quota errors, briefly prefer local reads — then retry Firestore (e.g. after Blaze). */
const READ_FALLBACK_TTL_MS = 45_000;

/**
 * Wraps a primary InstitutionRepository with quota fallback + request memoization.
 * Exported for focused adapter tests (forwards optional admin pagination methods).
 */
export function createFallbackInstitutionDataAccess(
  primary: InstitutionDataAccess,
  getFallback: () => Promise<InstitutionDataAccess>,
): InstitutionDataAccess {
  let fallbackPromise: Promise<InstitutionDataAccess> | undefined;
  let fallbackUntilMs = 0;

  const fallback = async (): Promise<InstitutionDataAccess> => {
    fallbackPromise ??= getFallback();
    return fallbackPromise;
  };

  const wrapRead = <TArgs extends unknown[], TResult>(
    methodName: keyof InstitutionDataAccess,
    invoke: (repo: InstitutionDataAccess, ...args: TArgs) => Promise<TResult>,
  ) => {
    return async (...args: TArgs): Promise<TResult> => {
      const preferFallback = Date.now() < fallbackUntilMs;
      if (preferFallback) {
        return invoke(await fallback(), ...args);
      }
      try {
        const result = await invoke(primary, ...args);
        fallbackUntilMs = 0;
        return result;
      } catch (error) {
        if (!isQuotaOrUnavailableError(error)) {
          throw error;
        }
        fallbackUntilMs = Date.now() + READ_FALLBACK_TTL_MS;
        console.warn(
          `[eduatlas] Institution repository.${String(methodName)} fell back to local empty/seed store (retry Firestore in ${READ_FALLBACK_TTL_MS / 1000}s):`,
          error instanceof Error ? error.message : error,
        );
        return invoke(await fallback(), ...args);
      }
    };
  };

  const wrapWrite = <TArgs extends unknown[], TResult>(
    methodName: keyof InstitutionDataAccess,
    invoke: (repo: InstitutionDataAccess, ...args: TArgs) => Promise<TResult>,
  ) => {
    return async (...args: TArgs): Promise<TResult> => {
      try {
        return await invoke(primary, ...args);
      } catch (error) {
        // Never write to the empty local fallback — that looks like a successful
        // import while nothing reaches Firestore.
        console.error(
          `[eduatlas] Institution repository.${String(methodName)} failed:`,
          error instanceof Error ? error.message : error,
        );
        throw error;
      }
    };
  };

  return {
    // Request-scoped memoization: avoid re-reading the same institution doc twice
    // during a single Next server render pass.
    getById: requestCacheAsync(wrapRead("getById", (repo, id: InstitutionId) => repo.getById(id))),
    getBySlug: requestCacheAsync(
      wrapRead("getBySlug", (repo, slug: string) => repo.getBySlug(slug)),
    ),
    list: wrapRead("list", (repo, options?: InstitutionListOptions) => repo.list(options)),
    listRelatedPublishedByCity: wrapRead(
      "listRelatedPublishedByCity",
      (repo, cityId: string, limit: number) => {
        if (!repo.listRelatedPublishedByCity) {
          throw new Error(
            "InstitutionRepository.listRelatedPublishedByCity is not available on this adapter.",
          );
        }
        return repo.listRelatedPublishedByCity(cityId, limit);
      },
    ),
    listPublishedBrowsePage: wrapRead(
      "listPublishedBrowsePage",
      (repo, input: { pageSize: number; cursor?: string | null }) => {
        if (!repo.listPublishedBrowsePage) {
          throw new Error(
            "InstitutionRepository.listPublishedBrowsePage is not available on this adapter.",
          );
        }
        return repo.listPublishedBrowsePage(input);
      },
    ),
    listAdminPage: wrapRead("listAdminPage", (repo, input: InstitutionAdminListPageInput) => {
      if (!repo.listAdminPage) {
        throw new Error("InstitutionRepository.listAdminPage is not available on this adapter.");
      }
      return repo.listAdminPage(input);
    }),
    countAdmin: wrapRead("countAdmin", (repo, filters?: InstitutionAdminListFilters) => {
      if (!repo.countAdmin) {
        throw new Error("InstitutionRepository.countAdmin is not available on this adapter.");
      }
      return repo.countAdmin(filters);
    }),
    sumAdminQualityScore: wrapRead(
      "sumAdminQualityScore",
      (repo, filters?: InstitutionAdminListFilters) => {
        if (!repo.sumAdminQualityScore) {
          throw new Error(
            "InstitutionRepository.sumAdminQualityScore is not available on this adapter.",
          );
        }
        return repo.sumAdminQualityScore(filters);
      },
    ),
    save: wrapWrite("save", (repo, institution: Institution) => repo.save(institution)),
    saveMany: wrapWrite("saveMany", async (repo, institutions: readonly Institution[]) => {
      if (repo.saveMany) {
        return repo.saveMany(institutions);
      }
      const saved: Institution[] = [];
      for (const institution of institutions) {
        saved.push(await repo.save(institution));
      }
      return Object.freeze(saved);
    }),
    update: wrapWrite("update", (repo, institution: Institution) => repo.update(institution)),
    delete: wrapWrite("delete", (repo, id: InstitutionId) => repo.delete(id)),
    search: wrapRead("search", (repo, query: InstitutionSearchQuery) => repo.search(query)),
  };
}

async function getInstitutionDataAccess(): Promise<InstitutionDataAccess> {
  if (!repositoryPromise) {
    repositoryPromise = canUseFirestoreBackend()
      ? Promise.resolve(
          createFallbackInstitutionDataAccess(
            createFirestoreInstitutionRepository(getAdminFirestore()),
            () => createLocalInstitutionDataAccess(),
          ),
        )
      : createLocalInstitutionDataAccess();
  }

  return repositoryPromise;
}

/**
 * Returns the InstitutionRepository used by server routes.
 * Prefers Firestore Admin. Dummy seed institutions are off unless
 * EDUATLAS_USE_SEED_INSTITUTIONS=true.
 */
export function getInstitutionRepository(): Promise<InstitutionRepository> {
  return getInstitutionDataAccess();
}

/**
 * Returns the InstitutionSearchRepository used by public search.
 */
export function getInstitutionSearchRepository(): Promise<InstitutionSearchRepository> {
  return getInstitutionDataAccess();
}

/**
 * Clears the repository singleton so the next call recreates Firestore access
 * (drops sticky/TTL read-fallback state). Safe to call before large imports.
 */
export function resetInstitutionRepository(): void {
  repositoryPromise = undefined;
}

/**
 * @deprecated Use {@link resetInstitutionRepository}
 */
export function resetInstitutionRepositoryForTests(): void {
  resetInstitutionRepository();
}
