import { cityIdAsString, districtIdAsString } from "@eduatlas/domain";
import { buildTurkeyGeographySeedCatalog } from "@eduatlas/firebase/server";
import { resolveCategorySeoContent } from "@eduatlas/seo";

/**
 * Resolves display names for city/district hubs from the in-memory geography seed (no Firestore).
 */
export function resolveGeoHubLabels(citySlug: string, districtSlug?: string) {
  const catalog = buildTurkeyGeographySeedCatalog();
  const city = catalog.cities.find((item) => {
    const id = cityIdAsString(item.id);
    const slug = citySlug.trim().toLowerCase();
    return item.slug === slug || id === slug || id === `city_${slug}`;
  });

  if (!city) {
    return null;
  }

  if (!districtSlug) {
    return {
      citySlug: city.slug,
      cityName: city.nameTr,
      districtSlug: undefined,
      districtName: undefined,
    };
  }

  const district = catalog.districts.find((item) => {
    const slug = districtSlug.trim().toLowerCase();
    const id = districtIdAsString(item.id);
    return (
      (item.slug === slug || id.endsWith(`-${slug}`)) &&
      cityIdAsString(item.cityId) === cityIdAsString(city.id)
    );
  });

  if (!district) {
    return {
      citySlug: city.slug,
      cityName: city.nameTr,
      districtSlug: districtSlug.trim().toLowerCase(),
      districtName: undefined,
    };
  }

  return {
    citySlug: city.slug,
    cityName: city.nameTr,
    districtSlug: district.slug,
    districtName: district.nameTr,
  };
}

export function resolveTypeHubLabel(typeSlug: string) {
  return resolveCategorySeoContent(typeSlug).name;
}
