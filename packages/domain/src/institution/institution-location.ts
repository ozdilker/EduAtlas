/**
 * Geographic / address location for an institution.
 */
export type InstitutionLocation = Readonly<{
  readonly cityId: string;
  readonly districtId: string;
  readonly address: string;
  readonly locationNotes?: string;
  /** Optional public Google Maps place / directions URL. */
  readonly googleMapsUrl?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly geohash?: string;
}>;

export type CreateInstitutionLocationInput = {
  cityId: string;
  districtId: string;
  address: string;
  locationNotes?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
};

const ADDRESS_MAX_LENGTH = 500;

/**
 * Creates an immutable InstitutionLocation.
 */
export function createInstitutionLocation(
  input: CreateInstitutionLocationInput,
): InstitutionLocation {
  const cityId = input.cityId.trim();
  const districtId = input.districtId.trim();
  const address = input.address.trim();
  const locationNotes = input.locationNotes?.trim();
  const googleMapsUrl = normalizeHttpUrl(input.googleMapsUrl, "googleMapsUrl");
  const geohash = input.geohash?.trim();

  if (!cityId) {
    throw new Error("InstitutionLocation.cityId is required.");
  }

  if (!districtId) {
    throw new Error("InstitutionLocation.districtId is required.");
  }

  if (!address) {
    throw new Error("InstitutionLocation.address is required.");
  }

  if (address.length > ADDRESS_MAX_LENGTH) {
    throw new Error(
      `InstitutionLocation.address must be at most ${ADDRESS_MAX_LENGTH} characters.`,
    );
  }

  if (input.latitude !== undefined && (input.latitude < -90 || input.latitude > 90)) {
    throw new Error("InstitutionLocation.latitude must be between -90 and 90.");
  }

  if (input.longitude !== undefined && (input.longitude < -180 || input.longitude > 180)) {
    throw new Error("InstitutionLocation.longitude must be between -180 and 180.");
  }

  return Object.freeze({
    cityId,
    districtId,
    address,
    ...(locationNotes ? { locationNotes } : {}),
    ...(googleMapsUrl ? { googleMapsUrl } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    ...(geohash ? { geohash } : {}),
  });
}

function normalizeHttpUrl(value: string | undefined, field: string): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }

    return url.toString();
  } catch {
    throw new Error(`InstitutionLocation.${field} must be a valid http(s) URL.`);
  }
}
