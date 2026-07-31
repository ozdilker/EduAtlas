import { getLastSearchCityId } from "./parent-search-location-storage";
import { findNearestCityId } from "./turkey-city-centroids";

export type HomeFeaturedLocationSource = "search" | "geolocation" | "national";

export type HomeFeaturedLocation = Readonly<{
  readonly cityId: string | null;
  readonly source: HomeFeaturedLocationSource;
}>;

const GEOLOCATION_TIMEOUT_MS = 4000;

function readBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("geolocation_unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

/**
 * Resolves homepage featured city: last search → GPS nearest city → national.
 * GPS results are not persisted to localStorage.
 */
export async function resolveHomeFeaturedLocation(): Promise<HomeFeaturedLocation> {
  const lastSearch = getLastSearchCityId();
  if (lastSearch) {
    return Object.freeze({ cityId: lastSearch, source: "search" });
  }

  try {
    const position = await readBrowserPosition();
    const cityId = findNearestCityId(position.coords.latitude, position.coords.longitude);
    if (cityId) {
      return Object.freeze({ cityId, source: "geolocation" });
    }
  } catch {
    // denied / timeout / unavailable → national
  }

  return Object.freeze({ cityId: null, source: "national" });
}
