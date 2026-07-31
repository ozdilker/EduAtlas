import {
  cityIdAsString,
  districtIdAsString,
  InstitutionType,
  InstitutionVerification,
  isInstitutionType,
} from "@eduatlas/domain";
import { buildTurkeyGeographySeedCatalog } from "@eduatlas/firebase/server";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

export type SearchFilterOption = {
  readonly id: string;
  readonly label: string;
};

export type SearchActiveFilters = {
  readonly cityId?: string;
  readonly districtId?: string;
  readonly type?: InstitutionType;
  readonly verified?: boolean;
  readonly premium?: boolean;
};

export type SearchFilterOptionsView = {
  readonly cities: readonly SearchFilterOption[];
  readonly districts: readonly SearchFilterOption[];
  readonly types: readonly SearchFilterOption[];
  readonly active: SearchActiveFilters;
  readonly query: string;
  readonly sort: string;
};

const CITY_PRIORITY = [
  "istanbul",
  "ankara",
  "izmir",
  "bursa",
  "antalya",
  "gaziantep",
  "konya",
  "adana",
  "mersin",
  "kayseri",
] as const;

function resolveSearchCityId(
  raw: string | undefined,
  cityMap: ReadonlyMap<string, string>,
): string | undefined {
  const value = raw?.trim();
  if (!value) {
    return undefined;
  }
  if (cityMap.has(value)) {
    return value;
  }
  const stripped = value.replace(/^city_/i, "");
  if (cityMap.has(stripped)) {
    return stripped;
  }
  return undefined;
}

/**
 * Builds city / district / type options for the public search sidebar.
 * Uses Türkiye geography catalog ids (e.g. istanbul) so Excel imports match filters.
 */
export function getSearchFilterOptions(input: {
  query?: string;
  sort?: string;
  cityId?: string;
  districtId?: string;
  type?: string;
  verified?: string;
  premium?: string;
}): SearchFilterOptionsView {
  const catalog = buildTurkeyGeographySeedCatalog();
  const cityMap = new Map<string, string>();
  const districtsByCity = new Map<string, SearchFilterOption[]>();

  for (const city of catalog.cities) {
    const id = cityIdAsString(city.id);
    cityMap.set(id, city.nameTr);
  }
  for (const district of catalog.districts) {
    const cityId = cityIdAsString(district.cityId);
    const list = districtsByCity.get(cityId) ?? [];
    list.push({
      id: districtIdAsString(district.id),
      label: district.nameTr,
    });
    districtsByCity.set(cityId, list);
  }

  const cities: SearchFilterOption[] = [
    ...CITY_PRIORITY.filter((id) => cityMap.has(id)).map((id) => ({
      id,
      label: cityMap.get(id) ?? id,
    })),
    ...[...cityMap.entries()]
      .filter(([id]) => !(CITY_PRIORITY as readonly string[]).includes(id))
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr")),
  ];

  const cityId = resolveSearchCityId(input.cityId, cityMap);
  const districtIdRaw = input.districtId?.trim() || undefined;
  const districts = cityId
    ? [...(districtsByCity.get(cityId) ?? [])].sort((a, b) => a.label.localeCompare(b.label, "tr"))
    : [];
  const districtId =
    cityId && districtIdRaw && districts.some((item) => item.id === districtIdRaw)
      ? districtIdRaw
      : undefined;

  const typeRaw = input.type?.trim() || undefined;
  const type = typeRaw && isInstitutionType(typeRaw) ? typeRaw : undefined;

  const verified =
    input.verified === "1" || input.verified === "true"
      ? true
      : input.verified === "0" || input.verified === "false"
        ? false
        : undefined;
  const premium =
    input.premium === "1" || input.premium === "true"
      ? true
      : input.premium === "0" || input.premium === "false"
        ? false
        : undefined;

  return {
    cities,
    districts,
    types: Object.values(InstitutionType).map((value) => ({
      id: value,
      label: getInstitutionTypeLabel(value),
    })),
    active: {
      ...(cityId ? { cityId } : {}),
      ...(districtId ? { districtId } : {}),
      ...(type ? { type } : {}),
      ...(verified ? { verified: true } : {}),
      ...(premium ? { premium: true } : {}),
    },
    query: input.query?.trim() ?? "",
    sort: input.sort?.trim() || "relevance",
  };
}

/**
 * District options for a city — used by the search sidebar async loader.
 */
export function getDistrictOptionsForCity(cityIdRaw: string | undefined): readonly SearchFilterOption[] {
  const catalog = buildTurkeyGeographySeedCatalog();
  const cityMap = new Map<string, string>();
  for (const city of catalog.cities) {
    cityMap.set(cityIdAsString(city.id), city.nameTr);
  }

  const cityId = resolveSearchCityId(cityIdRaw, cityMap);
  if (!cityId) {
    return Object.freeze([]);
  }

  const districts = catalog.districts
    .filter((district) => cityIdAsString(district.cityId) === cityId)
    .map((district) => ({
      id: districtIdAsString(district.id),
      label: district.nameTr,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));

  return Object.freeze(districts);
}

export function toSearchFiltersInput(active: SearchActiveFilters) {
  return {
    ...(active.cityId ? { cityId: active.cityId } : {}),
    ...(active.districtId ? { districtId: active.districtId } : {}),
    ...(active.type ? { primaryType: active.type } : {}),
    ...(active.verified ? { verification: InstitutionVerification.Verified } : {}),
    ...(active.premium ? { isPremium: true } : {}),
  };
}
