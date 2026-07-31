/**
 * Centralized cache TTLs (milliseconds).
 *
 * These are tuned for cost reduction while still tolerating staleness.
 */
export const CACHE_TTL_MS = Object.freeze({
  cities: 600_000, // 10 minutes
  districts: 600_000, // 10 minutes
  institutionList: 60_000, // 60 seconds (existing behavior)
  settings: 300_000, // 5 minutes
});

