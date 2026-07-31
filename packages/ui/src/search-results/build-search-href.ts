export type SearchHrefParams = {
  q?: string;
  city?: string;
  district?: string;
  type?: string;
  verified?: boolean;
  premium?: boolean;
  sort?: string;
  page?: number;
};

/**
 * Builds a `/search` URL from active filter / sort / page state.
 */
export function buildSearchHref(params: SearchHrefParams): string {
  const search = new URLSearchParams();
  const q = params.q?.trim();
  if (q) search.set("q", q);
  if (params.city) search.set("city", params.city);
  if (params.district) search.set("district", params.district);
  if (params.type) search.set("type", params.type);
  if (params.verified) search.set("verified", "1");
  if (params.premium) search.set("premium", "1");
  if (params.sort && params.sort !== "relevance") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/search?${qs}` : "/search";
}

export type SearchFilterOption = {
  id: string;
  label: string;
};

export type SearchActiveFiltersView = {
  cityId?: string;
  districtId?: string;
  type?: string;
  verified?: boolean;
  premium?: boolean;
};

export type SearchFiltersViewModel = {
  cities: readonly SearchFilterOption[];
  districts: readonly SearchFilterOption[];
  types: readonly SearchFilterOption[];
  active: SearchActiveFiltersView;
  query: string;
  sort: string;
};

type NullableOverride<T> = T | null | undefined;

export type SearchHrefOverrides = {
  q?: NullableOverride<string>;
  city?: NullableOverride<string>;
  district?: NullableOverride<string>;
  type?: NullableOverride<string>;
  verified?: NullableOverride<boolean>;
  premium?: NullableOverride<boolean>;
  sort?: NullableOverride<string>;
  page?: number;
};

function resolveOverride<T>(override: NullableOverride<T>, fallback: T | undefined): T | undefined {
  if (override === null) {
    return undefined;
  }
  if (override !== undefined) {
    return override;
  }
  return fallback;
}

export function toSearchHrefParams(
  filters: SearchFiltersViewModel,
  overrides: SearchHrefOverrides = {},
): SearchHrefParams {
  return {
    q: resolveOverride(overrides.q, filters.query),
    city: resolveOverride(overrides.city, filters.active.cityId),
    district: resolveOverride(overrides.district, filters.active.districtId),
    type: resolveOverride(overrides.type, filters.active.type),
    verified: resolveOverride(overrides.verified, filters.active.verified),
    premium: resolveOverride(overrides.premium, filters.active.premium),
    sort: resolveOverride(overrides.sort, filters.sort),
    page: overrides.page,
  };
}
