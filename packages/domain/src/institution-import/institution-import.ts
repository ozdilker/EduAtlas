import { foldTurkishText, isValidInstitutionSlug, normalizeInstitutionSlug } from "../institution";

/**
 * Raw institution candidate parsed from a CSV/XLSX row.
 * All values are trimmed strings exactly as provided by the file;
 * validation happens later in the import pipeline.
 */
export type InstitutionImport = Readonly<{
  /** 1-based row number in the source file (excluding header). */
  readonly rowNumber: number;
  readonly name: string;
  /** Provided slug; empty when the file omits it (a slug preview is generated). */
  readonly slug: string;
  readonly primaryType: string;
  readonly cityId: string;
  readonly districtId: string;
  readonly address: string;
  readonly shortDescription: string;
  readonly longDescription: string;
  readonly phone: string;
  readonly email: string;
  readonly whatsappNumber: string;
  readonly websiteUrl: string;
  readonly facebookUrl: string;
  readonly instagramUrl: string;
  readonly programsSummary: string;
  readonly ageOrLevelFocus: string;
  readonly latitude: string;
  readonly longitude: string;
}>;

export type CreateInstitutionImportInput = {
  rowNumber: number;
  values: Readonly<Partial<Record<InstitutionImportField, string>>>;
};

export const INSTITUTION_IMPORT_FIELDS = Object.freeze([
  "name",
  "slug",
  "primaryType",
  "cityId",
  "districtId",
  "address",
  "shortDescription",
  "longDescription",
  "phone",
  "email",
  "whatsappNumber",
  "websiteUrl",
  "facebookUrl",
  "instagramUrl",
  "programsSummary",
  "ageOrLevelFocus",
  "latitude",
  "longitude",
] as const);

export type InstitutionImportField = (typeof INSTITUTION_IMPORT_FIELDS)[number];

export const REQUIRED_INSTITUTION_IMPORT_FIELDS: readonly InstitutionImportField[] = Object.freeze([
  "name",
]);

/**
 * Creates an immutable raw import row from parsed file values.
 */
export function createInstitutionImport(input: CreateInstitutionImportInput): InstitutionImport {
  if (!Number.isInteger(input.rowNumber) || input.rowNumber < 1) {
    throw new Error("InstitutionImport.rowNumber must be an integer >= 1.");
  }

  const value = (field: InstitutionImportField): string => (input.values[field] ?? "").trim();

  return Object.freeze({
    rowNumber: input.rowNumber,
    name: value("name"),
    slug: value("slug"),
    primaryType: value("primaryType"),
    cityId: value("cityId"),
    districtId: value("districtId"),
    address: value("address"),
    shortDescription: value("shortDescription"),
    longDescription: value("longDescription"),
    phone: value("phone"),
    email: value("email"),
    whatsappNumber: value("whatsappNumber"),
    websiteUrl: value("websiteUrl"),
    facebookUrl: value("facebookUrl"),
    instagramUrl: value("instagramUrl"),
    programsSummary: value("programsSummary"),
    ageOrLevelFocus: value("ageOrLevelFocus"),
    latitude: value("latitude"),
    longitude: value("longitude"),
  });
}

/**
 * Generates a URL-safe institution slug from a Turkish display name.
 * Deterministic: same name always yields the same base slug.
 */
export function slugifyInstitutionName(name: string): string {
  return foldTurkishText(name).replaceAll(/\s+/g, "-").replaceAll(/-+/g, "-").slice(0, 120);
}

/**
 * Resolves the base slug an import row would use: the provided slug when
 * present, otherwise a slug generated from the name.
 * Callers should run {@link allocateUniqueImportSlug} when collisions exist.
 */
export function resolveImportSlug(row: InstitutionImport): string {
  const provided = normalizeInstitutionSlug(row.slug);
  if (provided && isValidInstitutionSlug(provided)) {
    return provided;
  }
  return slugifyInstitutionName(row.name);
}

export type AllocateUniqueImportSlugInput = Readonly<{
  readonly baseSlug: string;
  /** District geography slug (preferred disambiguator per URL-STRATEGY). */
  readonly districtSlug?: string;
  /** City geography slug (fallback disambiguator). */
  readonly citySlug?: string;
  /** Slugs already reserved (DB + earlier rows in this file). */
  readonly taken: ReadonlySet<string>;
}>;

export type AllocateUniqueImportSlugResult = Readonly<{
  readonly slug: string;
  /** True when a disambiguator was appended because `baseSlug` was taken. */
  readonly disambiguated: boolean;
}>;

/**
 * Ensures a globally unique institution slug.
 * Order: base → `-{district}` → `-{city}` → `-{city}-{district}` → `-2`…`-n`.
 */
export function allocateUniqueImportSlug(
  input: AllocateUniqueImportSlugInput,
): AllocateUniqueImportSlugResult {
  const base = normalizeInstitutionSlug(input.baseSlug).slice(0, 120);
  if (!base) {
    return Object.freeze({ slug: "", disambiguated: false });
  }

  const district = sanitizeGeoSlugToken(input.districtSlug);
  const city = sanitizeGeoSlugToken(input.citySlug);

  const candidates: string[] = [base];
  if (district) {
    candidates.push(clipSlug(`${base}-${district}`));
  }
  if (city) {
    candidates.push(clipSlug(`${base}-${city}`));
  }
  if (city && district) {
    candidates.push(clipSlug(`${base}-${city}-${district}`));
  }

  for (const candidate of candidates) {
    if (candidate && isValidInstitutionSlug(candidate) && !input.taken.has(candidate)) {
      return Object.freeze({
        slug: candidate,
        disambiguated: candidate !== base,
      });
    }
  }

  for (let n = 2; n < 1000; n += 1) {
    const candidate = clipSlug(`${base}-${n}`);
    if (isValidInstitutionSlug(candidate) && !input.taken.has(candidate)) {
      return Object.freeze({ slug: candidate, disambiguated: true });
    }
  }

  const fallback = clipSlug(`${base}-${city || district || "x"}`);
  return Object.freeze({ slug: fallback, disambiguated: true });
}

/**
 * Turns catalog or legacy geo ids into a slug token when catalog slug is unknown.
 * e.g. `city_ankara` → `ankara`, `dist_kadikoy` → `kadikoy`.
 */
export function slugTokenFromGeoId(id: string): string {
  return sanitizeGeoSlugToken(
    id
      .trim()
      .toLowerCase()
      .replace(/^(city_|dist_|district_)/i, "")
      .replaceAll("_", "-"),
  );
}

/**
 * Duplicate-detection key: Turkish-folded name + city + district.
 * Same-named schools in different cities or districts are not duplicates.
 */
export function importDuplicateKey(name: string, cityId: string, districtId = ""): string {
  return `${foldTurkishText(name)}::${cityId.trim()}::${districtId.trim()}`;
}

function sanitizeGeoSlugToken(raw: string | undefined): string {
  if (!raw?.trim()) {
    return "";
  }
  return foldTurkishText(raw)
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9-]/g, "")
    .replaceAll(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function clipSlug(slug: string): string {
  return normalizeInstitutionSlug(slug).slice(0, 120);
}
