import type { SitemapInstitutionRef, SitemapSnapshot } from "./types";

function maxIso(a: string | undefined, b: string): string {
  if (!a) return b;
  return a >= b ? a : b;
}

function institutionLastmod(ref: SitemapInstitutionRef): string {
  return ref.updatedAt || ref.publishedAt || ref.createdAt || "";
}

/**
 * Derives supply-gated hub lastmod maps from published institution refs.
 */
export function deriveSitemapHubIndexes(
  institutions: readonly SitemapInstitutionRef[],
): Pick<SitemapSnapshot, "cities" | "districts" | "categories" | "cityTypes"> {
  const cities = new Map<string, string>();
  const districts = new Map<string, string>();
  const categories = new Map<string, string>();
  const cityTypes = new Map<string, string>();

  for (const ref of institutions) {
    const lastmod = institutionLastmod(ref);
    if (!ref.slug || !ref.citySlug || !ref.districtSlug || !ref.typeSlug || !lastmod) {
      continue;
    }

    cities.set(ref.citySlug, maxIso(cities.get(ref.citySlug), lastmod));

    const districtKey = `${ref.citySlug}/${ref.districtSlug}`;
    districts.set(districtKey, maxIso(districts.get(districtKey), lastmod));

    categories.set(ref.typeSlug, maxIso(categories.get(ref.typeSlug), lastmod));

    const cityTypeKey = `${ref.citySlug}|${ref.typeSlug}`;
    cityTypes.set(cityTypeKey, maxIso(cityTypes.get(cityTypeKey), lastmod));
  }

  return {
    cities,
    districts,
    categories,
    cityTypes,
  };
}

/**
 * Builds a complete snapshot from site URL + institution refs.
 */
export function createSitemapSnapshot(input: {
  siteUrl: string;
  generatedAt: string;
  institutions: readonly SitemapInstitutionRef[];
}): SitemapSnapshot {
  const hubs = deriveSitemapHubIndexes(input.institutions);
  return Object.freeze({
    generatedAt: input.generatedAt,
    siteUrl: input.siteUrl.replace(/\/+$/, ""),
    institutions: Object.freeze([...input.institutions]),
    cities: hubs.cities,
    districts: hubs.districts,
    categories: hubs.categories,
    cityTypes: hubs.cityTypes,
  });
}
