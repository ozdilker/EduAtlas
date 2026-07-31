import type { CityRepository, DistrictRepository } from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import type { City, District } from "@eduatlas/domain";
import {
  createFirestoreCityRepository,
  createFirestoreDistrictRepository,
  createSeededGeographyRepositories,
  getAdminFirestore,
} from "@eduatlas/firebase/server";
import { requestCacheAsync } from "@eduatlas/firebase/cache";

type GeographyDataAccess = Readonly<{
  cityRepository: CityRepository;
  districtRepository: DistrictRepository;
}>;

let geographyPromise: Promise<GeographyDataAccess> | undefined;
let seededGeographyPromise: Promise<GeographyDataAccess> | undefined;

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

function getSeededGeography(): Promise<GeographyDataAccess> {
  seededGeographyPromise ??= createSeededGeographyRepositories();
  return seededGeographyPromise;
}

function withGeographyFallback<TArgs extends unknown[], TResult>(
  methodName: string,
  primaryInvoke: (...args: TArgs) => Promise<TResult>,
  fallbackInvoke: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  let usingFallback = false;
  return async (...args: TArgs): Promise<TResult> => {
    if (usingFallback) {
      return fallbackInvoke(...args);
    }
    try {
      return await primaryInvoke(...args);
    } catch (error) {
      if (!isQuotaOrUnavailableError(error)) {
        throw error;
      }
      usingFallback = true;
      console.warn(
        `[eduatlas] Geography ${methodName} fell back to seeded Türkiye catalog:`,
        error instanceof Error ? error.message : error,
      );
      return fallbackInvoke(...args);
    }
  };
}

function wrapCityRepository(primary: CityRepository, fallback: CityRepository): CityRepository {
  return {
    getById: requestCacheAsync(
      withGeographyFallback(
        "city.getById",
        (id: string) => primary.getById(id),
        (id: string) => fallback.getById(id),
      ),
    ),
    getBySlug: requestCacheAsync(
      withGeographyFallback(
        "city.getBySlug",
        (slug: string) => primary.getBySlug(slug),
        (slug: string) => fallback.getBySlug(slug),
      ),
    ),
    getByPlateCode: requestCacheAsync(
      withGeographyFallback(
        "city.getByPlateCode",
        (plateCode: string) => primary.getByPlateCode(plateCode),
        (plateCode: string) => fallback.getByPlateCode(plateCode),
      ),
    ),
    list: withGeographyFallback(
      "city.list",
      (options) => primary.list(options),
      (options) => fallback.list(options),
    ),
    search: withGeographyFallback(
      "city.search",
      (query: string) => primary.search(query),
      (query: string) => fallback.search(query),
    ),
  };
}

function wrapDistrictRepository(
  primary: DistrictRepository,
  fallback: DistrictRepository,
): DistrictRepository {
  return {
    getById: requestCacheAsync(
      withGeographyFallback(
        "district.getById",
        (id: string) => primary.getById(id),
        (id: string) => fallback.getById(id),
      ),
    ),
    getBySlug: requestCacheAsync(
      withGeographyFallback(
        "district.getBySlug",
        (cityId: string, slug: string) => primary.getBySlug(cityId, slug),
        (cityId: string, slug: string) => fallback.getBySlug(cityId, slug),
      ),
    ),
    listByCityId: withGeographyFallback(
      "district.listByCityId",
      (cityId: string, options) => primary.listByCityId(cityId, options),
      (cityId: string, options) => fallback.listByCityId(cityId, options),
    ),
    search: withGeographyFallback(
      "district.search",
      (query: string, cityId?: string) => primary.search(query, cityId),
      (query: string, cityId?: string) => fallback.search(query, cityId),
    ),
  };
}

async function getGeographyDataAccess(): Promise<GeographyDataAccess> {
  if (!geographyPromise) {
    geographyPromise = (async () => {
      if (!canUseFirestoreBackend()) {
        return getSeededGeography();
      }

      const seeded = await getSeededGeography();
      return {
        cityRepository: wrapCityRepository(
          createFirestoreCityRepository(getAdminFirestore()),
          seeded.cityRepository,
        ),
        districtRepository: wrapDistrictRepository(
          createFirestoreDistrictRepository(getAdminFirestore()),
          seeded.districtRepository,
        ),
      };
    })();
  }

  return geographyPromise;
}

/**
 * Local Türkiye geography catalog — preferred for Excel import (no Firestore quota).
 */
export function getSeededGeographyRepositories(): Promise<GeographyDataAccess> {
  return getSeededGeography();
}

/**
 * City catalog for public pages / import geography resolution.
 */
export async function getCityRepository(): Promise<CityRepository> {
  const access = await getGeographyDataAccess();
  return access.cityRepository;
}

/**
 * District catalog for public pages / import geography resolution.
 */
export async function getDistrictRepository(): Promise<DistrictRepository> {
  const access = await getGeographyDataAccess();
  return access.districtRepository;
}

export function resetGeographyRepositoriesForTests(): void {
  geographyPromise = undefined;
  seededGeographyPromise = undefined;
}

// Keep types referenced for wrap helpers clarity in editors.
export type { City, District };
