import type { CityRepository } from "./city-repository";
import type { DistrictRepository } from "./district-repository";
import {
  buildGeographyStatisticsPlaceholder,
  type GeographyStatisticsPlaceholder,
} from "./geography-statistics";
import { listCities } from "./list-cities";
import { listDistricts } from "./list-districts";

export type GetGeographyCatalogSummaryDependencies = {
  cityRepository: CityRepository;
  districtRepository: DistrictRepository;
};

export type GeographyCatalogSummary = Readonly<{
  readonly statistics: GeographyStatisticsPlaceholder;
  readonly cityIds: readonly string[];
}>;

/**
 * Read-only geography catalog summary with statistics placeholders.
 */
export async function getGeographyCatalogSummary(
  deps: GetGeographyCatalogSummaryDependencies,
): Promise<GeographyCatalogSummary> {
  const cities = await listCities({}, { cityRepository: deps.cityRepository });
  let districtCount = 0;

  for (const city of cities) {
    const districts = await listDistricts(
      { cityId: city.id.value },
      { districtRepository: deps.districtRepository },
    );
    districtCount += districts.length;
  }

  return Object.freeze({
    statistics: buildGeographyStatisticsPlaceholder({
      cityCount: cities.length,
      districtCount,
      priorityCityCount: cities.filter((city) => city.isPriority).length,
    }),
    cityIds: Object.freeze(cities.map((city) => city.id.value)),
  });
}
