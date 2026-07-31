import type { Institution } from "./institution";
import { hasPublishableContact } from "./institution-contact";
import { InstitutionStatus, isPubliclyVisibleStatus } from "./institution-status";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Normalizes a public institution slug (lowercase, trimmed).
 */
export function normalizeInstitutionSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Validates institution slug shape (ASCII, hyphenated).
 */
export function assertValidInstitutionSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug) || slug.length < 2 || slug.length > 120) {
    throw new Error(
      "Institution.slug must be 2–120 chars, lowercase ASCII letters/digits with hyphens.",
    );
  }
}

export function isValidInstitutionSlug(slug: string): boolean {
  try {
    assertValidInstitutionSlug(normalizeInstitutionSlug(slug));
    return true;
  } catch {
    return false;
  }
}

/**
 * Turkish-aware fold for search matching (display names stay untouched).
 */
export function foldTurkishText(input: string): string {
  return input
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll(/[^a-z0-9\s-]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/**
 * Tokenizes a name into search keywords.
 */
export function tokenizeSearchKeywords(name: string): string[] {
  const folded = foldTurkishText(name);

  if (!folded) {
    return [];
  }

  return [...new Set(folded.split(" ").filter((token) => token.length > 0))];
}

/**
 * Whether an institution may appear in public search / SEO.
 */
export function canAppearInPublicSearch(institution: Institution): boolean {
  return isPubliclyVisibleStatus(institution.status);
}

/**
 * Publish readiness checks (DOMAIN-MODEL publish gates). Does not mutate.
 */
export type InstitutionPublishValidation = Readonly<{
  readonly ok: boolean;
  readonly errors: readonly string[];
}>;

/**
 * Validates whether an institution satisfies publish requirements.
 */
export function validateInstitutionForPublish(
  institution: Institution,
): InstitutionPublishValidation {
  const errors: string[] = [];

  if (!institution.name.trim()) {
    errors.push("name is required");
  }

  if (!isValidInstitutionSlug(institution.slug)) {
    errors.push("slug is invalid");
  }

  if (!institution.shortDescription.trim()) {
    errors.push("shortDescription is required");
  }

  if (!institution.location.cityId || !institution.location.districtId) {
    errors.push("cityId and districtId are required");
  }

  if (!institution.location.address.trim()) {
    errors.push("address is required");
  }

  if (!hasPublishableContact(institution.contact)) {
    errors.push("contact phone or email is required to publish");
  }

  if (
    institution.status === InstitutionStatus.Published &&
    (!institution.publishedAt || Number.isNaN(Date.parse(institution.publishedAt)))
  ) {
    errors.push("publishedAt is required for published institutions");
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
  });
}

/**
 * Throws when the institution cannot be published.
 */
export function assertInstitutionPublishable(institution: Institution): void {
  const result = validateInstitutionForPublish(institution);

  if (!result.ok) {
    throw new Error(`Institution is not publishable: ${result.errors.join("; ")}`);
  }
}
