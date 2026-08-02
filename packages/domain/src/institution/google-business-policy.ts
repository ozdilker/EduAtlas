import type { GoogleBusinessSnapshot } from "./google-business-snapshot";
import { GoogleBusinessSyncStatus } from "./google-business-sync-status";
import type { Institution } from "./institution";

/** Successful sync is considered fresh for this many days (non-premium). */
export const GOOGLE_BUSINESS_CACHE_DAYS = 90;

/** First retry delay after a failed sync. */
export const GOOGLE_BUSINESS_RETRY_DELAY_DAYS_FIRST = 7;

/** Second retry delay after another failure. */
export const GOOGLE_BUSINESS_RETRY_DELAY_DAYS_SECOND = 30;

export type GoogleBusinessSyncDecision =
  | { readonly action: "skip"; readonly reason: string }
  | { readonly action: "sync"; readonly reason: string; readonly rematch: boolean };

/**
 * Whether a lazy (or admin) Google sync should run for this institution.
 */
export function decideGoogleBusinessSync(
  institution: Institution,
  options: Readonly<{
    readonly now?: Date;
    readonly force?: boolean;
    readonly rematch?: boolean;
    /** Premium cadence reserved for a later PRD — hook only. */
    readonly cacheDays?: number;
  }> = {},
): GoogleBusinessSyncDecision {
  const now = options.now ?? new Date();
  const cacheDays = options.cacheDays ?? GOOGLE_BUSINESS_CACHE_DAYS;
  const snapshot = institution.googleBusiness;

  if (options.rematch || options.force) {
    return {
      action: "sync",
      reason: options.rematch ? "admin_rematch" : "admin_force",
      rematch: Boolean(options.rematch),
    };
  }

  if (!snapshot || snapshot.syncStatus === GoogleBusinessSyncStatus.NeverSynced) {
    return { action: "sync", reason: "never_synced", rematch: false };
  }

  if (snapshot.syncStatus === GoogleBusinessSyncStatus.ManualRequired) {
    return { action: "skip", reason: "manual_required" };
  }

  if (snapshot.syncStatus === GoogleBusinessSyncStatus.Pending) {
    return { action: "skip", reason: "already_pending" };
  }

  if (
    snapshot.syncStatus === GoogleBusinessSyncStatus.Failed ||
    snapshot.syncStatus === GoogleBusinessSyncStatus.NotFound
  ) {
    if (snapshot.nextRetryAt) {
      const next = Date.parse(snapshot.nextRetryAt);
      if (!Number.isNaN(next) && now.getTime() < next) {
        return { action: "skip", reason: "retry_not_due" };
      }
    }
    return {
      action: "sync",
      reason: "retry_due",
      rematch: !snapshot.placeId,
    };
  }

  if (!snapshot.placeId) {
    return { action: "sync", reason: "missing_place_id", rematch: true };
  }

  if (snapshot.lastSyncedAt) {
    const last = Date.parse(snapshot.lastSyncedAt);
    if (!Number.isNaN(last)) {
      const ageMs = now.getTime() - last;
      const maxMs = cacheDays * 24 * 60 * 60 * 1000;
      if (ageMs < maxMs) {
        return { action: "skip", reason: "cache_fresh" };
      }
    }
  }

  return { action: "sync", reason: "cache_stale", rematch: false };
}

/**
 * Computes nextRetryAt / status after a failed attempt.
 */
export function planGoogleBusinessRetry(
  snapshot: GoogleBusinessSnapshot | undefined,
  now: Date,
): Readonly<{
  readonly retryCount: number;
  readonly nextRetryAt?: string;
  readonly syncStatus: typeof GoogleBusinessSyncStatus.Failed | typeof GoogleBusinessSyncStatus.ManualRequired;
}> {
  const retryCount = (snapshot?.retryCount ?? 0) + 1;
  if (retryCount === 1) {
    return {
      retryCount,
      nextRetryAt: addDaysIso(now, GOOGLE_BUSINESS_RETRY_DELAY_DAYS_FIRST),
      syncStatus: GoogleBusinessSyncStatus.Failed,
    };
  }
  if (retryCount === 2) {
    return {
      retryCount,
      nextRetryAt: addDaysIso(now, GOOGLE_BUSINESS_RETRY_DELAY_DAYS_SECOND),
      syncStatus: GoogleBusinessSyncStatus.Failed,
    };
  }
  return {
    retryCount,
    syncStatus: GoogleBusinessSyncStatus.ManualRequired,
  };
}

function addDaysIso(now: Date, days: number): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
