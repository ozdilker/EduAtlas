/**
 * Institution publish lifecycle (DOMAIN-MODEL canonical lifecycle).
 */
export enum InstitutionStatus {
  Draft = "draft",
  PendingReview = "pending_review",
  Published = "published",
  Archived = "archived",
  Deleted = "deleted",
}

const INSTITUTION_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(InstitutionStatus));

/**
 * Returns true when value is a known InstitutionStatus.
 */
export function isInstitutionStatus(value: string): value is InstitutionStatus {
  return INSTITUTION_STATUS_VALUES.has(value);
}

/**
 * Parses a raw string into InstitutionStatus or throws.
 */
export function parseInstitutionStatus(raw: string): InstitutionStatus {
  const value = raw.trim();

  if (!isInstitutionStatus(value)) {
    throw new Error(`Unknown InstitutionStatus: ${raw}`);
  }

  return value;
}

/**
 * Public search / SEO eligibility.
 */
export function isPubliclyVisibleStatus(status: InstitutionStatus): boolean {
  return status === InstitutionStatus.Published;
}
