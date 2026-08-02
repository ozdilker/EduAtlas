import type {
  GooglePlaceDetails,
  GooglePlaceSearchQuery,
  GooglePlacesProvider,
} from "@eduatlas/application";

/** Places API (New) field masks — only fields we persist / score. Never reviews. */
export const GOOGLE_PLACES_SEARCH_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.photos";

export const GOOGLE_PLACES_DETAILS_FIELD_MASK =
  "id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,websiteUri,photos";

export type HttpGooglePlacesProviderOptions = Readonly<{
  readonly apiKey: string;
  readonly fetchImpl?: typeof fetch;
}>;

/**
 * Google Places API (New) HTTP adapter. Server-only — API key never exposed to the browser.
 */
export class HttpGooglePlacesProvider implements GooglePlacesProvider {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HttpGooglePlacesProviderOptions) {
    this.apiKey = options.apiKey.trim();
    this.fetchImpl = options.fetchImpl ?? fetch;
    if (!this.apiKey) {
      throw new Error("HttpGooglePlacesProvider requires a non-empty apiKey.");
    }
  }

  async searchText(query: GooglePlaceSearchQuery): Promise<readonly GooglePlaceDetails[]> {
    const response = await this.fetchImpl("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": GOOGLE_PLACES_SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query.textQuery,
        languageCode: query.languageCode ?? "tr",
        regionCode: query.regionCode ?? "TR",
        maxResultCount: query.maxResultCount ?? 5,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Places searchText failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const json = (await response.json()) as { places?: unknown[] };
    const places = Array.isArray(json.places) ? json.places : [];
    return Object.freeze(
      places
        .map((row) => mapPlace(row))
        .filter((row): row is GooglePlaceDetails => row !== null),
    );
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    const resource = normalizePlaceResourceName(placeId);
    const response = await this.fetchImpl(
      `https://places.googleapis.com/v1/${encodeURI(resource)}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": GOOGLE_PLACES_DETAILS_FIELD_MASK,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Places getDetails failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const json = await response.json();
    return mapPlace(json);
  }
}

/**
 * No-op provider when the API key is absent (local/dev without Places).
 */
export class NoopGooglePlacesProvider implements GooglePlacesProvider {
  async searchText(): Promise<readonly GooglePlaceDetails[]> {
    return Object.freeze([]);
  }

  async getPlaceDetails(): Promise<GooglePlaceDetails | null> {
    return null;
  }
}

function normalizePlaceResourceName(placeId: string): string {
  const trimmed = placeId.trim();
  if (trimmed.startsWith("places/")) {
    return trimmed;
  }
  return `places/${trimmed}`;
}

function stripPlacesPrefix(id: string): string {
  return id.startsWith("places/") ? id.slice("places/".length) : id;
}

function mapPlace(raw: unknown): GooglePlaceDetails | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const idRaw = typeof row.id === "string" ? row.id.trim() : "";
  if (!idRaw) {
    return null;
  }

  const displayName =
    row.displayName && typeof row.displayName === "object" && !Array.isArray(row.displayName)
      ? (row.displayName as Record<string, unknown>).text
      : undefined;
  const placeName = typeof displayName === "string" ? displayName.trim() : "";
  if (!placeName) {
    return null;
  }

  const formattedAddress =
    typeof row.formattedAddress === "string" ? row.formattedAddress.trim() : undefined;
  const rating = typeof row.rating === "number" && Number.isFinite(row.rating) ? row.rating : undefined;
  const reviewCount =
    typeof row.userRatingCount === "number" && Number.isFinite(row.userRatingCount)
      ? Math.trunc(row.userRatingCount)
      : undefined;
  const mapsUrl = typeof row.googleMapsUri === "string" ? row.googleMapsUri.trim() : undefined;
  const businessUrl = typeof row.websiteUri === "string" ? row.websiteUri.trim() : undefined;
  const photoReferences = extractPhotoReferences(row.photos);

  return Object.freeze({
    placeId: stripPlacesPrefix(idRaw),
    placeName,
    ...(formattedAddress ? { formattedAddress } : {}),
    ...(rating !== undefined ? { rating } : {}),
    ...(reviewCount !== undefined ? { reviewCount } : {}),
    ...(mapsUrl ? { mapsUrl } : {}),
    ...(businessUrl ? { businessUrl } : {}),
    ...(photoReferences.length > 0 ? { photoReferences: Object.freeze(photoReferences) } : {}),
  });
}

function extractPhotoReferences(photos: unknown): string[] {
  if (!Array.isArray(photos)) {
    return [];
  }
  const refs: string[] = [];
  for (const entry of photos) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const name = (entry as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim()) {
      refs.push(name.trim());
    }
    if (refs.length >= 10) {
      break;
    }
  }
  return refs;
}

/**
 * Creates a Places provider from env; falls back to no-op when key missing.
 */
export function createGooglePlacesProviderFromEnv(
  env: Readonly<{ GOOGLE_PLACES_API_KEY?: string | undefined }> = {
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  },
): GooglePlacesProvider {
  const key = env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    return new NoopGooglePlacesProvider();
  }
  return new HttpGooglePlacesProvider({ apiKey: key });
}
