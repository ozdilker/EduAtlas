/**
 * Lifecycle for education catalog taxonomy items.
 */
export enum EducationCatalogStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

const STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(EducationCatalogStatus));

export function isEducationCatalogStatus(value: string): value is EducationCatalogStatus {
  return STATUS_VALUES.has(value);
}

export function parseEducationCatalogStatus(raw: string): EducationCatalogStatus {
  const value = raw.trim();
  if (!isEducationCatalogStatus(value)) {
    throw new Error(`Unknown EducationCatalogStatus: ${raw}`);
  }
  return value;
}

export function isPublishedEducationCatalogStatus(status: EducationCatalogStatus): boolean {
  return status === EducationCatalogStatus.Published;
}
