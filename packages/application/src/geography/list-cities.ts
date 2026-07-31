import type { City, GeoLifecycleStatus } from "@eduatlas/domain";
import type { CityListOptions, CityRepository } from "./city-repository";

export type ListCitiesInput = {
  query?: string;
  isPriority?: boolean;
  lifecycleStatus?: GeoLifecycleStatus;
};

export type ListCitiesDependencies = {
  cityRepository: CityRepository;
};

/**
 * Read-only: list cities with optional search / priority / lifecycle filters.
 */
export async function listCities(
  input: ListCitiesInput = {},
  deps: ListCitiesDependencies,
): Promise<readonly City[]> {
  const options: CityListOptions = Object.freeze({
    ...(input.query?.trim() ? { query: input.query.trim() } : {}),
    ...(input.isPriority !== undefined ? { isPriority: input.isPriority } : {}),
    ...(input.lifecycleStatus ? { lifecycleStatus: input.lifecycleStatus } : {}),
  });

  return deps.cityRepository.list(options);
}
