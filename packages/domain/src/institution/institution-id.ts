/**
 * Opaque institution identity value object.
 */
export type InstitutionId = Readonly<{
  readonly value: string;
}>;

const INSTITUTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Creates an immutable InstitutionId.
 */
export function createInstitutionId(raw: string): InstitutionId {
  const value = raw.trim();

  if (!INSTITUTION_ID_PATTERN.test(value)) {
    throw new Error("InstitutionId must be 1–128 URL-safe characters.");
  }

  return Object.freeze({ value });
}

/**
 * Returns the raw string value of an InstitutionId.
 */
export function institutionIdAsString(id: InstitutionId): string {
  return id.value;
}

/**
 * Equality for InstitutionId value objects.
 */
export function institutionIdsEqual(left: InstitutionId, right: InstitutionId): boolean {
  return left.value === right.value;
}
