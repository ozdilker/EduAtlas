import {
  GoogleBusinessMatchMethod,
  GoogleBusinessSyncStatus,
  parseGoogleBusinessMatchMethod,
  parseGoogleBusinessSyncStatus,
  type GoogleBusinessMatchMethod as GoogleBusinessMatchMethodType,
  type GoogleBusinessSyncStatus as GoogleBusinessSyncStatusType,
} from "./google-business-sync-status";

/**
 * Cached Google Business / Places snapshot on an Institution.
 * Never includes review bodies or reviewer PII.
 */
export type GoogleBusinessSnapshot = Readonly<{
  readonly placeId?: string;
  readonly placeName?: string;
  readonly formattedAddress?: string;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly mapsUrl?: string;
  readonly businessUrl?: string;
  readonly photoReferences?: readonly string[];
  /** 0–1 confidence of the Place match. */
  readonly confidenceScore?: number;
  readonly matchMethod: GoogleBusinessMatchMethodType;
  readonly syncStatus: GoogleBusinessSyncStatusType;
  readonly lastSyncedAt?: string;
  readonly lastError?: string;
  readonly retryCount: number;
  readonly nextRetryAt?: string;
}>;

export type CreateGoogleBusinessSnapshotInput = {
  placeId?: string;
  placeName?: string;
  formattedAddress?: string;
  rating?: number;
  reviewCount?: number;
  mapsUrl?: string;
  businessUrl?: string;
  photoReferences?: readonly string[];
  confidenceScore?: number;
  matchMethod?: GoogleBusinessMatchMethodType | string;
  syncStatus?: GoogleBusinessSyncStatusType | string;
  lastSyncedAt?: string;
  lastError?: string;
  retryCount?: number;
  nextRetryAt?: string;
};

const PHOTO_REF_MAX = 10;

/**
 * Creates an immutable Google Business snapshot (sync metadata + display fields).
 */
export function createGoogleBusinessSnapshot(
  input: CreateGoogleBusinessSnapshotInput = {},
): GoogleBusinessSnapshot {
  const placeId = input.placeId?.trim();
  const placeName = input.placeName?.trim();
  const formattedAddress = input.formattedAddress?.trim();
  const mapsUrl = normalizeOptionalHttpUrl(input.mapsUrl, "mapsUrl");
  const businessUrl = normalizeOptionalHttpUrl(input.businessUrl, "businessUrl");
  const lastError = input.lastError?.trim();
  const photoReferences = normalizePhotoReferences(input.photoReferences);
  const matchMethod =
    typeof input.matchMethod === "string"
      ? parseGoogleBusinessMatchMethod(input.matchMethod)
      : (input.matchMethod ?? GoogleBusinessMatchMethod.Unmatched);
  const syncStatus =
    typeof input.syncStatus === "string"
      ? parseGoogleBusinessSyncStatus(input.syncStatus)
      : (input.syncStatus ?? GoogleBusinessSyncStatus.NeverSynced);
  const retryCount = input.retryCount ?? 0;

  if (retryCount < 0 || !Number.isInteger(retryCount)) {
    throw new Error("GoogleBusinessSnapshot.retryCount must be a non-negative integer.");
  }

  if (input.rating !== undefined && (input.rating < 0 || input.rating > 5)) {
    throw new Error("GoogleBusinessSnapshot.rating must be between 0 and 5.");
  }

  if (input.reviewCount !== undefined && (input.reviewCount < 0 || !Number.isInteger(input.reviewCount))) {
    throw new Error("GoogleBusinessSnapshot.reviewCount must be a non-negative integer.");
  }

  if (
    input.confidenceScore !== undefined &&
    (input.confidenceScore < 0 || input.confidenceScore > 1)
  ) {
    throw new Error("GoogleBusinessSnapshot.confidenceScore must be between 0 and 1.");
  }

  if (input.lastSyncedAt !== undefined) {
    assertIso(input.lastSyncedAt, "lastSyncedAt");
  }
  if (input.nextRetryAt !== undefined) {
    assertIso(input.nextRetryAt, "nextRetryAt");
  }

  return Object.freeze({
    ...(placeId ? { placeId } : {}),
    ...(placeName ? { placeName } : {}),
    ...(formattedAddress ? { formattedAddress } : {}),
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.reviewCount !== undefined ? { reviewCount: input.reviewCount } : {}),
    ...(mapsUrl ? { mapsUrl } : {}),
    ...(businessUrl ? { businessUrl } : {}),
    ...(photoReferences.length > 0 ? { photoReferences: Object.freeze(photoReferences) } : {}),
    ...(input.confidenceScore !== undefined ? { confidenceScore: input.confidenceScore } : {}),
    matchMethod,
    syncStatus,
    ...(input.lastSyncedAt ? { lastSyncedAt: input.lastSyncedAt } : {}),
    ...(lastError ? { lastError } : {}),
    retryCount,
    ...(input.nextRetryAt ? { nextRetryAt: input.nextRetryAt } : {}),
  });
}

export function emptyGoogleBusinessSnapshot(): GoogleBusinessSnapshot {
  return createGoogleBusinessSnapshot({
    matchMethod: GoogleBusinessMatchMethod.Unmatched,
    syncStatus: GoogleBusinessSyncStatus.NeverSynced,
    retryCount: 0,
  });
}

function normalizePhotoReferences(refs: readonly string[] | undefined): string[] {
  if (!refs?.length) {
    return [];
  }
  const out: string[] = [];
  for (const ref of refs) {
    const trimmed = ref.trim();
    if (trimmed && !out.includes(trimmed)) {
      out.push(trimmed);
    }
    if (out.length >= PHOTO_REF_MAX) {
      break;
    }
  }
  return out;
}

function normalizeOptionalHttpUrl(raw: string | undefined, field: string): string | undefined {
  const trimmed = raw?.trim();
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
    throw new Error(`GoogleBusinessSnapshot.${field} must be a valid http(s) URL.`);
  }
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`GoogleBusinessSnapshot.${field} must be an ISO timestamp.`);
  }
}
