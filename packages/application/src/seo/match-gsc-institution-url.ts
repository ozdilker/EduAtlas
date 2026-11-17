/**
 * Maps Google Search Console page URLs to EduAtlas institution profile slugs.
 * Only `/institutions/{slug}` paths resolve; no name-based guessing.
 */

export type GscInstitutionUrlMatch =
  | { readonly status: "matched"; readonly slug: string }
  | { readonly status: "unmatched_path" }
  | { readonly status: "invalid_url" }
  | { readonly status: "ambiguous"; readonly reason: string };

const INSTITUTION_PATH = /^\/institutions\/([^/]+)\/?$/i;

/**
 * Extracts a single institution slug from a GSC page URL, or marks unmatched/ambiguous.
 */
export function matchGscInstitutionUrl(rawUrl: string): GscInstitutionUrlMatch {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return Object.freeze({ status: "invalid_url" });
  }

  let pathname: string;
  try {
    if (trimmed.startsWith("/")) {
      pathname = trimmed.split("?")[0] ?? trimmed;
    } else {
      const parsed = new URL(trimmed);
      pathname = parsed.pathname;
    }
  } catch {
    return Object.freeze({ status: "invalid_url" });
  }

  const normalized = pathname.replace(/\/{2,}/g, "/");
  const match = INSTITUTION_PATH.exec(normalized);
  if (!match?.[1]) {
    return Object.freeze({ status: "unmatched_path" });
  }

  let slug: string;
  try {
    slug = decodeURIComponent(match[1]).trim();
  } catch {
    return Object.freeze({
      status: "ambiguous",
      reason: "slug_decode_failed",
    });
  }

  if (!slug || slug.includes("/") || slug.includes("..")) {
    return Object.freeze({
      status: "ambiguous",
      reason: "unsafe_slug",
    });
  }

  return Object.freeze({ status: "matched", slug });
}
