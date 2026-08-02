import {
  createGoogleBusinessSnapshot,
  createInstitution,
  createInstitutionId,
  decideGoogleBusinessSync,
  GoogleBusinessMatchMethod,
  GoogleBusinessSyncStatus,
  type Institution,
  institutionIdAsString,
  planGoogleBusinessRetry,
} from "@eduatlas/domain";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { toCreateInstitutionInput } from "../institution-quality/with-recalculated-institution-quality";
import {
  buildGooglePlaceSearchQuery,
  type GooglePlacesProvider,
} from "./google-places-provider";
import { pickBestGooglePlaceMatch } from "./match-google-place";

export type SyncGoogleBusinessInput = Readonly<{
  readonly institutionId: string;
  /** Force Places Details refresh (keep placeId when present). */
  readonly force?: boolean;
  /** Clear placeId and re-run Text Search match. */
  readonly rematch?: boolean;
  readonly cityName?: string;
  readonly now?: Date;
}>;

export type SyncGoogleBusinessResult = Readonly<{
  readonly institution: Institution;
  readonly skipped: boolean;
  readonly reason: string;
}>;

export type SyncGoogleBusinessDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
  readonly placesProvider: GooglePlacesProvider;
}>;

/**
 * Lazy / admin Google Business sync. Never stores review bodies or reviewer PII.
 */
export async function syncGoogleBusiness(
  input: SyncGoogleBusinessInput,
  deps: SyncGoogleBusinessDependencies,
): Promise<SyncGoogleBusinessResult> {
  const now = input.now ?? new Date();
  const institutionId = createInstitutionId(input.institutionId);
  const loaded = await deps.institutionRepository.getById(institutionId);

  if (!loaded) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const decision = decideGoogleBusinessSync(loaded, {
    now,
    force: input.force,
    rematch: input.rematch,
  });

  if (decision.action === "skip") {
    return Object.freeze({
      institution: loaded,
      skipped: true,
      reason: decision.reason,
    });
  }

  const rematch = decision.rematch || Boolean(input.rematch);
  const previous =
    !rematch && loaded.googleBusiness?.placeId ? loaded.googleBusiness : undefined;

  try {
    let placeId = previous?.placeId;
    let matchMethod = previous?.matchMethod ?? GoogleBusinessMatchMethod.Unmatched;
    let confidenceScore = previous?.confidenceScore;

    if (!placeId || rematch) {
      const textQuery = buildGooglePlaceSearchQuery(loaded, input.cityName);
      const candidates = await deps.placesProvider.searchText({
        textQuery,
        languageCode: "tr",
        regionCode: "TR",
        maxResultCount: 5,
      });

      const picked = pickBestGooglePlaceMatch(
        loaded.name,
        loaded.location.address,
        candidates,
      );

      if (!picked) {
        const retry = planGoogleBusinessRetry(loaded.googleBusiness, now);
        const notFound = createGoogleBusinessSnapshot({
          matchMethod: rematch
            ? GoogleBusinessMatchMethod.Rematch
            : GoogleBusinessMatchMethod.TextSearch,
          syncStatus:
            retry.syncStatus === GoogleBusinessSyncStatus.ManualRequired
              ? GoogleBusinessSyncStatus.ManualRequired
              : GoogleBusinessSyncStatus.NotFound,
          lastError: "No confident Google Place match.",
          retryCount: retry.retryCount,
          nextRetryAt: retry.nextRetryAt,
        });
        const saved = await persistSnapshot(deps, loaded, notFound, now);
        return Object.freeze({
          institution: saved,
          skipped: false,
          reason: "not_found",
        });
      }

      placeId = picked.candidate.placeId;
      confidenceScore = picked.confidenceScore;
      matchMethod = rematch
        ? GoogleBusinessMatchMethod.Rematch
        : GoogleBusinessMatchMethod.TextSearch;
    }

    const details = await deps.placesProvider.getPlaceDetails(placeId);
    if (!details) {
      throw new Error("Place details unavailable.");
    }

    const synced = createGoogleBusinessSnapshot({
      placeId: details.placeId,
      placeName: details.placeName,
      formattedAddress: details.formattedAddress,
      rating: details.rating,
      reviewCount: details.reviewCount,
      mapsUrl: details.mapsUrl,
      businessUrl: details.businessUrl,
      photoReferences: details.photoReferences,
      confidenceScore,
      matchMethod,
      syncStatus: GoogleBusinessSyncStatus.Synced,
      lastSyncedAt: now.toISOString(),
      retryCount: 0,
    });

    const saved = await persistSnapshot(deps, loaded, synced, now);
    return Object.freeze({
      institution: saved,
      skipped: false,
      reason: rematch ? "rematched" : "synced",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sync failed.";
    const retry = planGoogleBusinessRetry(loaded.googleBusiness, now);
    const failed = createGoogleBusinessSnapshot({
      ...(loaded.googleBusiness && !rematch
        ? {
            placeId: loaded.googleBusiness.placeId,
            placeName: loaded.googleBusiness.placeName,
            formattedAddress: loaded.googleBusiness.formattedAddress,
            rating: loaded.googleBusiness.rating,
            reviewCount: loaded.googleBusiness.reviewCount,
            mapsUrl: loaded.googleBusiness.mapsUrl,
            businessUrl: loaded.googleBusiness.businessUrl,
            photoReferences: loaded.googleBusiness.photoReferences,
            confidenceScore: loaded.googleBusiness.confidenceScore,
            matchMethod: loaded.googleBusiness.matchMethod,
          }
        : {
            matchMethod: rematch
              ? GoogleBusinessMatchMethod.Rematch
              : GoogleBusinessMatchMethod.TextSearch,
          }),
      syncStatus: retry.syncStatus,
      lastError: message.slice(0, 500),
      retryCount: retry.retryCount,
      nextRetryAt: retry.nextRetryAt,
      lastSyncedAt: loaded.googleBusiness?.lastSyncedAt,
    });
    const saved = await persistSnapshot(deps, loaded, failed, now);
    return Object.freeze({
      institution: saved,
      skipped: false,
      reason: "failed",
    });
  }
}

async function persistSnapshot(
  deps: SyncGoogleBusinessDependencies,
  institution: Institution,
  googleBusiness: ReturnType<typeof createGoogleBusinessSnapshot>,
  now: Date,
): Promise<Institution> {
  const updated = createInstitution({
    ...toCreateInstitutionInput(institution),
    googleBusiness,
    updatedAt: now.toISOString(),
  });
  return deps.institutionRepository.update(updated);
}

/**
 * Convenience: sync by institution entity already loaded.
 */
export async function syncGoogleBusinessForInstitution(
  institution: Institution,
  options: Omit<SyncGoogleBusinessInput, "institutionId">,
  deps: SyncGoogleBusinessDependencies,
): Promise<SyncGoogleBusinessResult> {
  return syncGoogleBusiness(
    {
      institutionId: institutionIdAsString(institution.id),
      ...options,
    },
    deps,
  );
}
