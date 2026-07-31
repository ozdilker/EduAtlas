import {
  cityIdAsString,
  districtIdAsString,
  foldTurkishText,
  type InstitutionSearchGeoLabels,
} from "@eduatlas/domain";
import { buildTurkeyGeographySeedCatalog } from "../geography/turkey-geography-seed";
import { INSTITUTION_SEED_DATASET } from "./institution-seeds";

export type GeoPlaceLabels = InstitutionSearchGeoLabels & {
  readonly cityId: string;
  readonly districtId: string;
};

function toPlaceSlug(name: string): string {
  return foldTurkishText(name).replaceAll(/\s+/g, "-");
}

/**
 * Builds a city/district label catalog from the development seed dataset.
 * Used until dedicated cities/districts collections ship.
 */
export function buildGeoCatalogFromSeeds(
  seeds: readonly {
    readonly cityId: string;
    readonly city: string;
    readonly districtId: string;
    readonly district: string;
  }[] = INSTITUTION_SEED_DATASET,
): ReadonlyMap<string, GeoPlaceLabels> {
  const catalog = new Map<string, GeoPlaceLabels>();

  for (const seed of seeds) {
    const key = geoCatalogKey(seed.cityId, seed.districtId);
    if (catalog.has(key)) {
      continue;
    }

    catalog.set(
      key,
      Object.freeze({
        cityId: seed.cityId,
        districtId: seed.districtId,
        cityName: seed.city,
        citySlug: toPlaceSlug(seed.city),
        districtName: seed.district,
        districtSlug: toPlaceSlug(seed.district),
      }),
    );
  }

  return catalog;
}

export function geoCatalogKey(cityId: string, districtId: string): string {
  return `${cityId}::${districtId}`;
}

const DEFAULT_GEO_CATALOG = buildGeoCatalogFromSeeds();

type TurkeyGeoLookup = Readonly<{
  citiesById: ReadonlyMap<string, { nameTr: string; slug: string }>;
  districtsById: ReadonlyMap<string, { nameTr: string; slug: string; cityId: string }>;
}>;

let turkeyLookup: TurkeyGeoLookup | undefined;

function getTurkeyGeoLookup(): TurkeyGeoLookup {
  if (turkeyLookup) {
    return turkeyLookup;
  }
  const catalog = buildTurkeyGeographySeedCatalog();
  const citiesById = new Map<string, { nameTr: string; slug: string }>();
  const districtsById = new Map<string, { nameTr: string; slug: string; cityId: string }>();

  for (const city of catalog.cities) {
    const id = cityIdAsString(city.id);
    citiesById.set(id, { nameTr: city.nameTr, slug: city.slug });
  }
  for (const district of catalog.districts) {
    const id = districtIdAsString(district.id);
    const cityId = cityIdAsString(district.cityId);
    districtsById.set(id, {
      nameTr: district.nameTr,
      slug: district.slug,
      cityId,
    });
  }

  turkeyLookup = Object.freeze({ citiesById, districtsById });
  return turkeyLookup;
}

/**
 * Resolves display geo labels for institution location ids.
 * Prefers institution-seed catalog, then Türkiye geography catalog, then slug fallback.
 */
export function resolveGeoLabels(
  cityId: string,
  districtId: string,
  catalog: ReadonlyMap<string, GeoPlaceLabels> = DEFAULT_GEO_CATALOG,
): InstitutionSearchGeoLabels {
  const match = catalog.get(geoCatalogKey(cityId, districtId));
  if (match) {
    return {
      citySlug: match.citySlug,
      cityName: match.cityName,
      districtSlug: match.districtSlug,
      districtName: match.districtName,
    };
  }

  const turkey = getTurkeyGeoLookup();
  const normalizedCityId = cityId.replace(/^city_/i, "");
  const city =
    turkey.citiesById.get(cityId) ?? turkey.citiesById.get(normalizedCityId) ?? undefined;
  const district =
    turkey.districtsById.get(districtId) ??
    turkey.districtsById.get(`${normalizedCityId}-${districtId.replace(/^dist_/i, "").replaceAll("_", "-")}`) ??
    undefined;

  if (city || district) {
    return {
      citySlug: city?.slug ?? toPlaceSlug(normalizedCityId),
      cityName: city?.nameTr ?? toPlaceSlug(normalizedCityId),
      districtSlug: district?.slug ?? toPlaceSlug(districtId.replace(/^dist_/i, "")),
      districtName: district?.nameTr ?? toPlaceSlug(districtId.replace(/^dist_/i, "")),
    };
  }

  const citySlug = toPlaceSlug(cityId.replace(/^city_/, ""));
  const districtSlug = toPlaceSlug(districtId.replace(/^dist_/, ""));

  return {
    citySlug,
    cityName: citySlug,
    districtSlug,
    districtName: districtSlug,
  };
}
