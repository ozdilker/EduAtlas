export const SEARCH_LOCATION_STORAGE_KEY = "eduatlas:last-search-city-id";
export const SEARCH_LOCATION_CHANGED_EVENT = "eduatlas:search-location-changed";

/**
 * Reads the last city id the parent searched with (browser localStorage).
 */
export function getLastSearchCityId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SEARCH_LOCATION_STORAGE_KEY);
    const value = raw?.trim() ?? "";
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * Persists last search city and notifies homepage featured listeners.
 * Empty / whitespace clears the stored city (Türkiye geneli).
 */
export function setLastSearchCityId(cityId: string | null | undefined): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const value = cityId?.trim() ?? "";
    if (!value) {
      window.localStorage.removeItem(SEARCH_LOCATION_STORAGE_KEY);
    } else {
      window.localStorage.setItem(SEARCH_LOCATION_STORAGE_KEY, value);
    }
    window.dispatchEvent(
      new CustomEvent(SEARCH_LOCATION_CHANGED_EVENT, { detail: { cityId: value || null } }),
    );
  } catch {
    // ignore quota / private mode
  }
}
