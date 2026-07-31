/**
 * Ownership / verification substate (orthogonal to publish lifecycle).
 * Maps DOMAIN-MODEL claimStatus; `verified` is the approved-owner state.
 */
export enum InstitutionVerification {
  Unclaimed = "unclaimed",
  Pending = "pending",
  Verified = "verified",
  Revoked = "revoked",
}

const INSTITUTION_VERIFICATION_VALUES: ReadonlySet<string> = new Set(
  Object.values(InstitutionVerification),
);

/**
 * Returns true when value is a known InstitutionVerification.
 */
export function isInstitutionVerification(value: string): value is InstitutionVerification {
  return INSTITUTION_VERIFICATION_VALUES.has(value);
}

/**
 * Parses a raw string into InstitutionVerification or throws.
 */
export function parseInstitutionVerification(raw: string): InstitutionVerification {
  const value = raw.trim();

  if (!isInstitutionVerification(value)) {
    throw new Error(`Unknown InstitutionVerification: ${raw}`);
  }

  return value;
}

/**
 * Whether the institution has an approved owner (verified claim).
 */
export function isInstitutionVerified(verification: InstitutionVerification): boolean {
  return verification === InstitutionVerification.Verified;
}
