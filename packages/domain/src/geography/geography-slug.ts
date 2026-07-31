import { foldTurkishText } from "../institution/validation";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Builds a Turkish-aware ASCII slug from a geography display name.
 */
export function slugifyGeographyName(name: string): string {
  const folded = foldTurkishText(name)
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");

  if (!folded) {
    throw new Error("Geography slug cannot be empty.");
  }

  return folded;
}

export function normalizeGeographySlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertValidGeographySlug(slug: string, field = "slug"): void {
  if (!SLUG_PATTERN.test(slug) || slug.length < 2 || slug.length > 120) {
    throw new Error(`${field} must be 2–120 chars, lowercase ASCII letters/digits with hyphens.`);
  }
}

export function isValidGeographySlug(slug: string): boolean {
  try {
    assertValidGeographySlug(normalizeGeographySlug(slug));
    return true;
  } catch {
    return false;
  }
}
