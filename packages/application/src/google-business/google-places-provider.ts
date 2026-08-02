import type { Institution } from "@eduatlas/domain";

/**
 * Minimal Place fields used by EduAtlas (Field Mask only — never review text).
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
}>;

export type GooglePlaceSearchQuery = Readonly<{
  readonly textQuery: string;
  readonly languageCode?: string;
  readonly regionCode?: string;
  /** Soft cap; provider may return fewer. */
  readonly maxResultCount?: number;
}>;

/**
 * Port for Google Places API (New). Infrastructure adapters implement this.
 */
export interface GooglePlacesProvider {
  searchText(query: GooglePlaceSearchQuery): Promise<readonly GooglePlaceDetails[]>;
  getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null>;
}

/**
 * Builds a Text Search query from institution identity + location.
 */
export function buildGooglePlaceSearchQuery(institution: Institution, cityName?: string): string {
  const parts = [
    institution.name.trim(),
    institution.location.address.trim(),
    cityName?.trim(),
  ].filter(Boolean);
  return parts.join(", ");
}
