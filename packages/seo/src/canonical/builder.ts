import { resolveCanonical } from "./resolver";

/**
 * Builds an absolute canonical URL from site origin + path.
 * Strips query strings and hash fragments from the path (default resolver policy).
 * Delegates to CanonicalResolver for a single source of truth.
 */
export function buildCanonical(siteUrl: string, path = "/"): string {
  return resolveCanonical({ siteUrl, path });
}
