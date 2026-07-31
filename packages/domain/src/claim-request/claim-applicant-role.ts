/**
 * Applicant role at the institution for ownership claims.
 */
export enum ClaimApplicantRole {
  Owner = "owner",
  Principal = "principal",
  Admissions = "admissions",
  Marketing = "marketing",
  Other = "other",
}

const CLAIM_APPLICANT_ROLE_VALUES: ReadonlySet<string> = new Set(Object.values(ClaimApplicantRole));

/**
 * Returns true when value is a known ClaimApplicantRole.
 */
export function isClaimApplicantRole(value: string): value is ClaimApplicantRole {
  return CLAIM_APPLICANT_ROLE_VALUES.has(value);
}

/**
 * Parses a raw string into ClaimApplicantRole or throws.
 */
export function parseClaimApplicantRole(raw: string): ClaimApplicantRole {
  const value = raw.trim();

  if (!isClaimApplicantRole(value)) {
    throw new Error(`Unknown ClaimApplicantRole: ${raw}`);
  }

  return value;
}
