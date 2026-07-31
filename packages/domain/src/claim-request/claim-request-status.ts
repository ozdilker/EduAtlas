/**
 * Claim request review status (DOMAIN-MODEL / PRD claim queue).
 */
export enum ClaimRequestStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

const CLAIM_REQUEST_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(ClaimRequestStatus));

/**
 * Returns true when value is a known ClaimRequestStatus.
 */
export function isClaimRequestStatus(value: string): value is ClaimRequestStatus {
  return CLAIM_REQUEST_STATUS_VALUES.has(value);
}

/**
 * Parses a raw string into ClaimRequestStatus or throws.
 */
export function parseClaimRequestStatus(raw: string): ClaimRequestStatus {
  const value = raw.trim();

  if (!isClaimRequestStatus(value)) {
    throw new Error(`Unknown ClaimRequestStatus: ${raw}`);
  }

  return value;
}
