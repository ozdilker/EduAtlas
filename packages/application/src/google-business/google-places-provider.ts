import type { Institution } from "@eduatlas/domain";

/**
 * Minimal Place fields used by EduAtlas (Field Mask only — never review text).
 * Phone / opening hours are optional enrichment-only fields (separate Field Mask).
 */
export type GooglePlaceDetails = Readonly<{
  readonly placeId: string;
  readonly placeName: string;
  readonly formattedAddress?: string;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly mapsUrl?: string;
  readonly businessUrl?: string;
  readonly photoReferences?: readonly string[];
  /** Places nationalPhoneNumber — enrichment field mask only. */
  readonly nationalPhoneNumber?: string;
  /** Places internationalPhoneNumber — enrichment field mask only. */
  readonly internationalPhoneNumber?: string;
  /** Places regularOpeningHours.weekdayDescriptions — enrichment field mask only. */
  readonly weekdayDescriptions?: readonly string[];
}>;

export type GooglePlaceSearchQuery = Readonly<{
  readonly textQuery: string;
  readonly languageCode?: string;
  readonly regionCode?: string;
  /** Soft cap; provider may return fewer. */
  readonly maxResultCount?: number;
}>;

/** Optional geo display labels for Text Search (not the full street address). */
export type GooglePlaceSearchLocation = Readonly<{
  readonly cityName?: string;
  readonly districtName?: string;
}>;

/**
 * Port for Google Places API (New). Infrastructure adapters implement this.
 */
export interface GooglePlacesProvider {
  searchText(query: GooglePlaceSearchQuery): Promise<readonly GooglePlaceDetails[]>;
  getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null>;
}

/**
 * Builds a Text Search query from institution identity + district/city labels.
 * Omits the full street address (door/iç kapı/mahalle noise harms match quality).
 *
 * @param location - Display labels, or a city name string (legacy callers).
 */
export function buildGooglePlaceSearchQuery(
  institution: Institution,
  location?: GooglePlaceSearchLocation | string,
): string {
  const labels = normalizeSearchLocation(location);
  const parts: string[] = [];

  const name = institution.name.trim();
  if (name) {
    parts.push(name);
  }

  appendUniqueLocationPart(parts, labels.districtName);
  appendUniqueLocationPart(parts, labels.cityName);

  return parts.join(" ").replaceAll(/\s+/g, " ").trim();
}

function normalizeSearchLocation(
  location: GooglePlaceSearchLocation | string | undefined,
): GooglePlaceSearchLocation {
  if (typeof location === "string") {
    return { cityName: location.trim() || undefined };
  }
  return {
    cityName: location?.cityName?.trim() || undefined,
    districtName: location?.districtName?.trim() || undefined,
  };
}

function appendUniqueLocationPart(parts: string[], value: string | undefined): void {
  const next = value?.trim();
  if (!next) {
    return;
  }
  const foldedNext = foldForCompare(next);
  if (!foldedNext) {
    return;
  }
  const alreadyPresent = parts.some((part) => foldForCompare(part).includes(foldedNext));
  if (!alreadyPresent) {
    parts.push(next);
  }
}

function foldForCompare(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll(/[^a-z0-9\s]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}
