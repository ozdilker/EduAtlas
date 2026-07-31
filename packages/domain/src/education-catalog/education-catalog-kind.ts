/**
 * Education reference catalogs (taxonomy) — not institution-owned offerings.
 */
export enum EducationCatalogKind {
  InstitutionTypes = "institution_types",
  Programs = "programs",
  EducationalApproaches = "educational_approaches",
  Languages = "languages",
  AgeGroups = "age_groups",
  ExamTypes = "exam_types",
  CourseCategories = "course_categories",
}

const KIND_VALUES: ReadonlySet<string> = new Set(Object.values(EducationCatalogKind));

export function isEducationCatalogKind(value: string): value is EducationCatalogKind {
  return KIND_VALUES.has(value);
}

export function parseEducationCatalogKind(raw: string): EducationCatalogKind {
  const value = raw.trim();
  if (!isEducationCatalogKind(value)) {
    throw new Error(`Unknown EducationCatalogKind: ${raw}`);
  }
  return value;
}

export const EDUCATION_CATALOG_KINDS: readonly EducationCatalogKind[] = Object.freeze(
  Object.values(EducationCatalogKind),
);

/**
 * Firestore collection id for a catalog kind (matches KIND string values).
 */
export function educationCatalogCollectionId(kind: EducationCatalogKind): string {
  return kind;
}
