/**
 * Google Places match / sync lifecycle for an institution.
 */
export const GoogleBusinessSyncStatus = Object.freeze({
  NeverSynced: "never_synced",
  Pending: "pending",
  Synced: "synced",
  Stale: "stale",
  Failed: "failed",
  NotFound: "not_found",
  ManualRequired: "manual_required",
} as const);

export type GoogleBusinessSyncStatus =
  (typeof GoogleBusinessSyncStatus)[keyof typeof GoogleBusinessSyncStatus];

export function isGoogleBusinessSyncStatus(value: string): value is GoogleBusinessSyncStatus {
  return Object.values(GoogleBusinessSyncStatus).includes(value as GoogleBusinessSyncStatus);
}

export function parseGoogleBusinessSyncStatus(value: string): GoogleBusinessSyncStatus {
  if (!isGoogleBusinessSyncStatus(value)) {
    throw new Error(`Unknown GoogleBusinessSyncStatus: ${value}`);
  }
  return value;
}

/**
 * How a Google Place was associated with the institution.
 * Note: key is TextSearch (not Search) to avoid TS const/type edge cases.
 */
export const GoogleBusinessMatchMethod = Object.freeze({
  Unmatched: "unmatched",
  TextSearch: "search",
  Manual: "manual",
  Rematch: "rematch",
} as const);

export type GoogleBusinessMatchMethod =
  (typeof GoogleBusinessMatchMethod)[keyof typeof GoogleBusinessMatchMethod];

export function isGoogleBusinessMatchMethod(value: string): value is GoogleBusinessMatchMethod {
  return Object.values(GoogleBusinessMatchMethod).includes(value as GoogleBusinessMatchMethod);
}

export function parseGoogleBusinessMatchMethod(value: string): GoogleBusinessMatchMethod {
  if (!isGoogleBusinessMatchMethod(value)) {
    throw new Error(`Unknown GoogleBusinessMatchMethod: ${value}`);
  }
  return value;
}
