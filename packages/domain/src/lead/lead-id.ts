/**
 * Opaque lead identity value object.
 */
export type LeadId = Readonly<{
  readonly value: string;
}>;

const LEAD_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Creates an immutable LeadId.
 */
export function createLeadId(raw: string): LeadId {
  const value = raw.trim();

  if (!LEAD_ID_PATTERN.test(value)) {
    throw new Error("LeadId must be 1–128 URL-safe characters.");
  }

  return Object.freeze({ value });
}

/**
 * Returns the raw string value of a LeadId.
 */
export function leadIdAsString(id: LeadId): string {
  return id.value;
}

/**
 * Equality for LeadId value objects.
 */
export function leadIdsEqual(left: LeadId, right: LeadId): boolean {
  return left.value === right.value;
}
