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
 * Deterministic: same name always yields the same slug.
 */
export function slugifyInstitutionName(name: string): string {
  return foldTurkishText(name).replaceAll(/\s+/g, "-").replaceAll(/-+/g, "-").slice(0, 120);
}

/**
 * Resolves the slug an import row would use: the provided slug when
 * present, otherwise a slug generated from the name.
 */
export function resolveImportSlug(row: InstitutionImport): string {
  const provided = normalizeInstitutionSlug(row.slug);
  if (provided && isValidInstitutionSlug(provided)) {
    return provided;
  }
  return slugifyInstitutionName(row.name);
}

/**
 * Duplicate-detection key: Turkish-folded name + city.
 * Mirrors the acquisition dashboard duplicate heuristic.
 */
export function importDuplicateKey(name: string, cityId: string): string {
  return `${foldTurkishText(name)}::${cityId.trim()}`;
}
