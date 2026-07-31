/**
 * Opaque education catalog item identity.
 */
export type EducationCatalogItemId = Readonly<{
  readonly value: string;
}>;

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function createEducationCatalogItemId(raw: string): EducationCatalogItemId {
  const value = raw.trim();
  if (!ID_PATTERN.test(value)) {
    throw new Error("EducationCatalogItemId must be 1–128 URL-safe characters.");
  }
  return Object.freeze({ value });
}

export function educationCatalogItemIdAsString(id: EducationCatalogItemId): string {
  return id.value;
}

export function educationCatalogItemIdsEqual(
  left: EducationCatalogItemId,
  right: EducationCatalogItemId,
): boolean {
  return left.value === right.value;
}
