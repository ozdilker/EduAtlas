/**
 * Query keys that must never appear on a canonical URL.
 * Open/Closed: append keys here without changing the resolver core.
 */
export const CANONICAL_TRACKING_QUERY_KEYS: readonly string[] = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "ref",
  "source",
  "tracking",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
]);

const TRACKING_EXACT = new Set(CANONICAL_TRACKING_QUERY_KEYS.map((key) => key.toLowerCase()));

/**
 * Content-oriented keys that may be allowlisted in a future PRD (e.g. pagination).
 * Not activated by default — resolveCanonical strips all queries unless allowQueryKeys is passed.
 */
export const CANONICAL_CONTENT_QUERY_ALLOWLIST: readonly string[] = Object.freeze(["page"]);

/**
 * Returns true when a query key is a tracking / attribution parameter.
 */
export function isCanonicalTrackingQueryKey(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized.startsWith("utm_")) {
    return true;
  }
  return TRACKING_EXACT.has(normalized);
}
