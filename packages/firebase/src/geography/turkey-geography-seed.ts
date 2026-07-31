import {
  type City,
  createCity,
  createDistrict,
  type District,
  foldTurkishText,
  GeoLifecycleStatus,
  slugifyGeographyName,
} from "@eduatlas/domain";
import cityListJson from "./data/city-list.json";
import districtsByCityCodeJson from "./data/districts-by-city-code.json";

type CityListEntry = {
  readonly code: string;
  readonly name: string;
};

type DistrictsByCityCode = Readonly<Record<string, readonly string[]>>;

const CITY_LIST = cityListJson as readonly CityListEntry[];
const DISTRICTS_BY_CITY_CODE = districtsByCityCodeJson as DistrictsByCityCode;

/** Official priority metros for catalog / SEO hub emphasis. */
export const PRIORITY_CITY_PLATE_CODES: ReadonlySet<string> = new Set([
  "01", // Adana
  "06", // Ankara
  "07", // Antalya
  "16", // Bursa
  "27", // Gaziantep
  "33", // Mersin
  "34", // İstanbul
  "35", // İzmir
  "38", // Kayseri
  "42", // Konya
]);

const SEED_TIMESTAMPS = Object.freeze({
  createdAt: "2026-07-15T12:00:00.000Z",
  updatedAt: "2026-07-15T12:00:00.000Z",
});

export type TurkeyGeographySeedCatalog = Readonly<{
  readonly cities: readonly City[];
  readonly districts: readonly District[];
}>;

function matchesQuery(nameTr: string, slug: string, query: string): boolean {
  const foldedQuery = foldTurkishText(query);
  if (!foldedQuery) {
    return true;
  }
  return foldTurkishText(nameTr).includes(foldedQuery) || slug.includes(foldedQuery);
}

/**
 * Builds the full Türkiye geography seed (81 cities + official districts).
 * Institutions are intentionally omitted — geography only.
 */
export function buildTurkeyGeographySeedCatalog(
  now: typeof SEED_TIMESTAMPS = SEED_TIMESTAMPS,
): TurkeyGeographySeedCatalog {
  if (CITY_LIST.length !== 81) {
    throw new Error(`Expected 81 cities, received ${CITY_LIST.length}.`);
  }

  const cities: City[] = [];
  const districts: District[] = [];

  for (const entry of [...CITY_LIST].sort((a, b) => a.code.localeCompare(b.code))) {
    const plateCode = entry.code.padStart(2, "0");
    const districtNames = DISTRICTS_BY_CITY_CODE[plateCode];
    if (!districtNames || districtNames.length === 0) {
      throw new Error(`Missing districts for plate code ${plateCode}.`);
    }

    const slug = slugifyGeographyName(entry.name);
    const city = createCity({
      id: slug,
      nameTr: entry.name,
      slug,
      plateCode,
      lifecycleStatus: GeoLifecycleStatus.Published,
      isPriority: PRIORITY_CITY_PLATE_CODES.has(plateCode),
      sortOrder: Number.parseInt(plateCode, 10),
      districtCount: districtNames.length,
      ...now,
    });
    cities.push(city);

    districtNames.forEach((districtName, index) => {
      districts.push(
        createDistrict({
          cityId: city.id.value,
          citySlug: city.slug,
          nameTr: districtName,
          sortOrder: index + 1,
          lifecycleStatus: GeoLifecycleStatus.Published,
          ...now,
        }),
      );
    });
  }

  if (districts.length < 900) {
    throw new Error(`Expected full district catalog, received ${districts.length}.`);
  }

  return Object.freeze({
    cities: Object.freeze(cities),
    districts: Object.freeze(districts),
  });
}

export function filterCitiesByQuery(cities: readonly City[], query?: string): readonly City[] {
  const trimmed = query?.trim();
  if (!trimmed) {
    return cities;
  }
  return Object.freeze(cities.filter((city) => matchesQuery(city.nameTr, city.slug, trimmed)));
}

export function filterDistrictsByQuery(
  districts: readonly District[],
  query?: string,
): readonly District[] {
  const trimmed = query?.trim();
  if (!trimmed) {
    return districts;
  }
  return Object.freeze(
    districts.filter((district) => matchesQuery(district.nameTr, district.slug, trimmed)),
  );
}

export { CITY_LIST, DISTRICTS_BY_CITY_CODE };
