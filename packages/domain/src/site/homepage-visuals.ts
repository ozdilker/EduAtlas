/**
 * Homepage marketing visuals — default hero + per-city images (any city slug).
 */

export const HOMEPAGE_POPULAR_CITY_IDS = Object.freeze([
  "istanbul",
  "ankara",
  "izmir",
  "bursa",
  "antalya",
  "gaziantep",
] as const);

export type HomepagePopularCityId = (typeof HOMEPAGE_POPULAR_CITY_IDS)[number];

export const DEFAULT_HOME_HERO_IMAGE_URL = "/images/home-hero.png";

/** URL-safe city slug used as visual slot key (e.g. istanbul, gaziantep). */
const CITY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type HomepageCityVisual = Readonly<{
  readonly imageUrl?: string;
  readonly storagePath?: string;
}>;

export type HomepageVisuals = Readonly<{
  readonly heroImageUrl?: string;
  readonly heroStoragePath?: string;
  /** Keyed by city slug — popular cards and hero city picker share this map. */
  readonly cityImages: Readonly<Partial<Record<string, HomepageCityVisual>>>;
  readonly updatedAt: string;
  readonly updatedByUserId?: string;
}>;

export type HomepageVisualSlot = "hero" | string;

export function isHomepagePopularCityId(value: string): value is HomepagePopularCityId {
  return (HOMEPAGE_POPULAR_CITY_IDS as readonly string[]).includes(value);
}

export function isHomepageCitySlug(value: string): boolean {
  return CITY_SLUG_PATTERN.test(value.trim()) && value.trim() !== "hero";
}

export function isHomepageVisualSlot(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "hero" || isHomepageCitySlug(trimmed);
}

export function createEmptyHomepageVisuals(now = new Date().toISOString()): HomepageVisuals {
  return Object.freeze({
    cityImages: Object.freeze({}),
    updatedAt: now,
  });
}

export type CreateHomepageVisualsInput = {
  readonly heroImageUrl?: string;
  readonly heroStoragePath?: string;
  readonly cityImages?: Partial<Record<string, HomepageCityVisual>>;
  readonly updatedAt?: string;
  readonly updatedByUserId?: string;
};

export function createHomepageVisuals(input: CreateHomepageVisualsInput = {}): HomepageVisuals {
  const cityImages: Partial<Record<string, HomepageCityVisual>> = {};
  for (const [cityId, visual] of Object.entries(input.cityImages ?? {})) {
    if (!isHomepageCitySlug(cityId) || !visual) {
      continue;
    }
    cityImages[cityId] = Object.freeze({
      ...(visual.imageUrl?.trim() ? { imageUrl: visual.imageUrl.trim() } : {}),
      ...(visual.storagePath?.trim() ? { storagePath: visual.storagePath.trim() } : {}),
    });
  }

  return Object.freeze({
    ...(input.heroImageUrl?.trim() ? { heroImageUrl: input.heroImageUrl.trim() } : {}),
    ...(input.heroStoragePath?.trim() ? { heroStoragePath: input.heroStoragePath.trim() } : {}),
    cityImages: Object.freeze(cityImages),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    ...(input.updatedByUserId?.trim() ? { updatedByUserId: input.updatedByUserId.trim() } : {}),
  });
}

export function resolveHomepageHeroImageUrl(visuals: HomepageVisuals | null | undefined): string {
  const url = visuals?.heroImageUrl?.trim();
  return url && url.length > 0 ? url : DEFAULT_HOME_HERO_IMAGE_URL;
}

export function resolveHomepageCityImageUrl(
  visuals: HomepageVisuals | null | undefined,
  cityId: string,
): string | undefined {
  if (!isHomepageCitySlug(cityId)) {
    return undefined;
  }
  const url = visuals?.cityImages[cityId]?.imageUrl?.trim();
  return url && url.length > 0 ? url : undefined;
}

/**
 * Resolves hero background for a selected city: city image → default hero.
 */
export function resolveHomepageHeroImageForCity(
  visuals: HomepageVisuals | null | undefined,
  citySlug: string | null | undefined,
): string {
  if (citySlug?.trim()) {
    const cityUrl = resolveHomepageCityImageUrl(visuals, citySlug.trim());
    if (cityUrl) {
      return cityUrl;
    }
  }
  return resolveHomepageHeroImageUrl(visuals);
}
