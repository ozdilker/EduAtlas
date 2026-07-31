import {
  InstitutionStatus,
  InstitutionType,
  isInstitutionStatus,
  isInstitutionType,
  isInstitutionVerification,
  isValidInstitutionSlug,
} from "@eduatlas/domain";
import { INSTITUTION_SEED_DATASET } from "./institution-seeds";
import {
  type InstitutionSeedRecord,
  type InstitutionSeedValidationIssue,
  type InstitutionSeedValidationResult,
  SEED_CITIES,
} from "./types";

const LOREM_PATTERN = /lorem|ipsum|dolor sit|placeholder text/i;

/**
 * Validates the institution development seed dataset.
 */
export function validateInstitutionSeeds(
  seeds: readonly InstitutionSeedRecord[] = INSTITUTION_SEED_DATASET,
): InstitutionSeedValidationResult {
  const issues: InstitutionSeedValidationIssue[] = [];

  if (seeds.length < 20) {
    issues.push({
      code: "MIN_COUNT",
      message: `Expected at least 20 institutions, found ${seeds.length}.`,
    });
  }

  const ids = new Set<string>();
  const slugs = new Set<string>();
  const names = new Set<string>();
  const cities = new Set<string>();
  const types = new Set<string>();

  for (const seed of seeds) {
    validateSeedRecord(seed, issues, ids, slugs, names, cities, types);
  }

  for (const city of SEED_CITIES) {
    if (![...cities].includes(city)) {
      issues.push({
        code: "MISSING_CITY",
        message: `Seed dataset must include city "${city}".`,
      });
    }
  }

  assertHasType(types, InstitutionType.PrivateSchool, "college/private_school", issues);
  assertHasType(types, InstitutionType.Kindergarten, "kindergarten", issues);
  assertHasType(types, InstitutionType.LanguageSchool, "language_school", issues);
  assertHasType(types, InstitutionType.EtutMerkezi, "etut_merkezi", issues);

  if (![...types].includes("university")) {
    issues.push({
      code: "MISSING_UNIVERSITY",
      message: "Seed dataset must include university entries with future flag.",
    });
  }

  const futureUniversities = seeds.filter((seed) => seed.futureUniversity);
  if (futureUniversities.length === 0) {
    issues.push({
      code: "MISSING_FUTURE_FLAG",
      message: "At least one university seed must set futureUniversity=true.",
    });
  }

  for (const seed of futureUniversities) {
    if (seed.type !== "university") {
      issues.push({
        code: "FUTURE_TYPE_MISMATCH",
        seedId: seed.id,
        message: 'futureUniversity seeds must use type "university".',
      });
    }
    if (seed.published) {
      issues.push({
        code: "FUTURE_PUBLISHED",
        seedId: seed.id,
        message: "University future seeds must not be published yet.",
      });
    }
  }

  return Object.freeze({
    ok: issues.length === 0,
    issues: Object.freeze(issues),
  });
}

/**
 * Throws when seed validation fails.
 */
export function assertValidInstitutionSeeds(
  seeds: readonly InstitutionSeedRecord[] = INSTITUTION_SEED_DATASET,
): void {
  const result = validateInstitutionSeeds(seeds);
  if (!result.ok) {
    const summary = result.issues.map((issue) => issue.message).join(" | ");
    throw new Error(`Institution seed validation failed: ${summary}`);
  }
}

function validateSeedRecord(
  seed: InstitutionSeedRecord,
  issues: InstitutionSeedValidationIssue[],
  ids: Set<string>,
  slugs: Set<string>,
  names: Set<string>,
  cities: Set<string>,
  types: Set<string>,
): void {
  const push = (code: string, message: string) => {
    issues.push({ code, message, seedId: seed.id });
  };

  if (!seed.id?.trim()) {
    push("MISSING_ID", "id is required.");
  } else if (ids.has(seed.id)) {
    push("DUPLICATE_ID", `Duplicate id "${seed.id}".`);
  } else {
    ids.add(seed.id);
  }

  if (!seed.slug?.trim() || !isValidInstitutionSlug(seed.slug)) {
    push("INVALID_SLUG", `Invalid slug "${seed.slug}".`);
  } else if (slugs.has(seed.slug)) {
    push("DUPLICATE_SLUG", `Duplicate slug "${seed.slug}".`);
  } else {
    slugs.add(seed.slug);
  }

  if (!seed.name?.trim()) {
    push("MISSING_NAME", "name is required.");
  } else if (names.has(seed.name)) {
    push("DUPLICATE_NAME", `Duplicate name "${seed.name}".`);
  } else {
    names.add(seed.name);
  }

  if (seed.type !== "university" && !isInstitutionType(seed.type)) {
    push("INVALID_TYPE", `Unknown type "${seed.type}".`);
  } else {
    types.add(seed.type);
  }

  if (!seed.city?.trim() || !seed.cityId?.trim()) {
    push("MISSING_CITY", "city and cityId are required.");
  } else {
    cities.add(seed.city);
  }

  if (!seed.district?.trim() || !seed.districtId?.trim()) {
    push("MISSING_DISTRICT", "district and districtId are required.");
  }

  if (!isInstitutionVerification(seed.verification)) {
    push("INVALID_VERIFICATION", `Invalid verification "${seed.verification}".`);
  }

  if (!isInstitutionStatus(seed.status)) {
    push("INVALID_STATUS", `Invalid status "${seed.status}".`);
  }

  const publishedExpected = seed.status === InstitutionStatus.Published;
  if (seed.published !== publishedExpected) {
    push("PUBLISHED_MISMATCH", `published=${seed.published} does not match status=${seed.status}.`);
  }

  if (!seed.contact?.phone && !seed.contact?.email) {
    push("MISSING_CONTACT", "contact phone or email is required.");
  }

  if (!seed.location?.address?.trim()) {
    push("MISSING_ADDRESS", "location.address is required.");
  }

  if (!seed.searchKeywords || seed.searchKeywords.length === 0) {
    push("MISSING_KEYWORDS", "searchKeywords must not be empty.");
  }

  if (!seed.shortDescription?.trim() || seed.shortDescription.trim().length < 40) {
    push("WEAK_DESCRIPTION", "shortDescription must be a meaningful Turkish summary.");
  }

  if (
    LOREM_PATTERN.test(seed.name) ||
    LOREM_PATTERN.test(seed.shortDescription) ||
    seed.searchKeywords.some((keyword) => LOREM_PATTERN.test(keyword))
  ) {
    push("LOREM_IPSUM", "Seed content must not contain lorem ipsum.");
  }
}

function assertHasType(
  types: Set<string>,
  type: InstitutionType,
  label: string,
  issues: InstitutionSeedValidationIssue[],
): void {
  if (!types.has(type)) {
    issues.push({
      code: "MISSING_TYPE",
      message: `Seed dataset must include ${label} (${type}).`,
    });
  }
}
