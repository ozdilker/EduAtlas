import { getHomepageVisuals, listCities } from "@eduatlas/application";
import {
  cityIdAsString,
  HOMEPAGE_POPULAR_CITY_IDS,
  resolveHomepageCityImageUrl,
  resolveHomepageHeroImageUrl,
} from "@eduatlas/domain";
import {
  buildTurkeyGeographySeedCatalog,
  createSeededGeographyRepositories,
} from "@eduatlas/firebase/server";
import { getCityRepository } from "../geography/repository";
import {
  discoverLocalHomepageVisualUrls,
  getHomepageVisualsRepository,
} from "./homepage-visuals-repository";

export type HomepageCityOptionView = Readonly<{
  /** Search filter id (e.g. istanbul) — submitted as `city` query param. */
  readonly id: string;
  /** Public slug / hero visual key (e.g. istanbul). */
  readonly slug: string;
  readonly label: string;
}>;

export type HomepageVisualsView = Readonly<{
  readonly heroImageUrl: string;
  readonly cityImageUrls: Readonly<Partial<Record<string, string>>>;
  readonly cities: readonly HomepageCityOptionView[];
}>;

function isQuotaOrUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "8" ||
    /RESOURCE_EXHAUSTED|Quota exceeded|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(`${code} ${message}`)
  );
}

/**
 * Full Türkiye city list from the local geography seed (no institution dummies).
 */
function citiesFromTurkeyGeography(): HomepageCityOptionView[] {
  return buildTurkeyGeographySeedCatalog()
    .cities.map((city) => ({
      id: cityIdAsString(city.id),
      slug: city.slug,
      label: city.nameTr,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

async function loadHomeCityOptions(): Promise<HomepageCityOptionView[]> {
  const fallback = citiesFromTurkeyGeography();

  try {
    const cityRepository = await getCityRepository();
    const cities = await listCities({}, { cityRepository });
    if (cities.length === 0) {
      return fallback;
    }

    return cities
      .map((city) => ({
        id: cityIdAsString(city.id),
        slug: city.slug,
        label: city.nameTr,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
  } catch (error) {
    if (!isQuotaOrUnavailableError(error)) {
      console.warn(
        "[eduatlas] Homepage city list fell back after geography failure:",
        error instanceof Error ? error.message : error,
      );
    } else {
      console.warn("[eduatlas] Homepage city list fell back after Firestore quota/unavailable.");
    }

    try {
      const { cityRepository } = await createSeededGeographyRepositories();
      const cities = await listCities({}, { cityRepository });
      if (cities.length === 0) {
        return fallback;
      }
      return cities
        .map((city) => ({
          id: cityIdAsString(city.id),
          slug: city.slug,
          label: city.nameTr,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "tr"));
    } catch {
      return fallback;
    }
  }
}

/**
 * Loads homepage marketing visuals + alphabetical city options for the public home page.
 */
export async function getHomepageVisualsView(): Promise<HomepageVisualsView> {
  let heroImageUrl = resolveHomepageHeroImageUrl(undefined);
  const cityImageUrls: Partial<Record<string, string>> = {};

  try {
    const homepageVisualsRepository = await getHomepageVisualsRepository();
    const visuals = await getHomepageVisuals({ homepageVisualsRepository });
    heroImageUrl = resolveHomepageHeroImageUrl(visuals);

    for (const [slug, visual] of Object.entries(visuals.cityImages)) {
      const url = visual?.imageUrl?.trim();
      if (slug && url) {
        cityImageUrls[slug] = url;
      }
    }
    for (const cityId of HOMEPAGE_POPULAR_CITY_IDS) {
      const url = resolveHomepageCityImageUrl(visuals, cityId);
      if (url) {
        cityImageUrls[cityId] = url;
      }
    }
  } catch (error) {
    console.warn(
      "[eduatlas] Homepage visuals fell back to defaults:",
      error instanceof Error ? error.message : error,
    );
  }

  // Fill gaps from files already on disk under public/media (local Storage fallback).
  try {
    const discovered = await discoverLocalHomepageVisualUrls();
    if (!heroImageUrl || heroImageUrl === resolveHomepageHeroImageUrl(undefined)) {
      if (discovered.heroImageUrl) {
        heroImageUrl = discovered.heroImageUrl;
      }
    }
    for (const [slug, url] of Object.entries(discovered.cityImageUrls)) {
      if (slug && url && !cityImageUrls[slug]) {
        cityImageUrls[slug] = url;
      }
    }
  } catch (error) {
    console.warn(
      "[eduatlas] Local homepage visual discovery skipped:",
      error instanceof Error ? error.message : error,
    );
  }

  const cities = await loadHomeCityOptions();

  return {
    heroImageUrl,
    cityImageUrls,
    cities,
  };
}
