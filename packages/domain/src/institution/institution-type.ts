/**
 * MVP institution verticals (DOMAIN-MODEL InstitutionType seed set).
 */
export enum InstitutionType {
  PrivateSchool = "private_school",
  Dershane = "dershane",
  EtutMerkezi = "etut_merkezi",
  LanguageSchool = "language_school",
  Kindergarten = "kindergarten",
  Preschool = "preschool",
}

const INSTITUTION_TYPE_VALUES: ReadonlySet<string> = new Set(Object.values(InstitutionType));

/**
 * Type → public slug used in hubs and search filters.
 */
export const INSTITUTION_TYPE_SLUGS: Readonly<Record<InstitutionType, string>> = Object.freeze({
  [InstitutionType.PrivateSchool]: "ozel-okul",
  [InstitutionType.Dershane]: "dershane",
  [InstitutionType.EtutMerkezi]: "etut-merkezi",
  [InstitutionType.LanguageSchool]: "dil-okulu",
  [InstitutionType.Kindergarten]: "anaokulu",
  [InstitutionType.Preschool]: "kres",
});

/**
 * Returns true when value is a known InstitutionType.
 */
export function isInstitutionType(value: string): value is InstitutionType {
  return INSTITUTION_TYPE_VALUES.has(value);
}

/**
 * Parses a raw string into InstitutionType or throws.
 */
export function parseInstitutionType(raw: string): InstitutionType {
  const value = raw.trim();

  if (!isInstitutionType(value)) {
    throw new Error(`Unknown InstitutionType: ${raw}`);
  }

  return value;
}

/**
 * Public slug for a type (search / SEO hubs).
 */
export function getInstitutionTypeSlug(type: InstitutionType): string {
  return INSTITUTION_TYPE_SLUGS[type];
}
