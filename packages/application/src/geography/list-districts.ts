import type { District, GeoLifecycleStatus } from "@eduatlas/domain";
import type { DistrictListOptions, DistrictRepository } from "./district-repository";

export type ListDistrictsInput = {
  cityId: string;
  query?: string;
  lifecycleStatus?: GeoLifecycleStatus;
};

export type ListDistrictsDependencies = {
  districtRepository: DistrictRepository;
};

/**
 * Read-only: list districts for a city with optional search / lifecycle filters.
 */
export async function listDistricts(
  input: ListDistrictsInput,
  deps: ListDistrictsDependencies,
): Promise<readonly District[]> {
  const cityId = input.cityId.trim();
  if (!cityId) {
    throw new Error("listDistricts requires cityId.");
  }

  const options: DistrictListOptions = Object.freeze({
    ...(input.query?.trim() ? { query: input.query.trim() } : {}),
    ...(input.lifecycleStatus ? { lifecycleStatus: input.lifecycleStatus } : {}),
  });

  return deps.districtRepository.listByCityId(cityId, options);
}
