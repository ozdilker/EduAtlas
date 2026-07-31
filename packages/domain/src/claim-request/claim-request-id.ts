/**
 * Opaque claim-request identity value object.
 */
export type ClaimRequestId = Readonly<{
  readonly value: string;
}>;

const CLAIM_REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Creates an immutable ClaimRequestId.
 */
export function createClaimRequestId(raw: string): ClaimRequestId {
  const value = raw.trim();

  if (!CLAIM_REQUEST_ID_PATTERN.test(value)) {
    throw new Error("ClaimRequestId must be 1–128 URL-safe characters.");
  }

  return Object.freeze({ value });
}

/**
 * Returns the raw string value of a ClaimRequestId.
 */
export function claimRequestIdAsString(id: ClaimRequestId): string {
  return id.value;
}

/**
 * Equality for ClaimRequestId value objects.
 */
export function claimRequestIdsEqual(left: ClaimRequestId, right: ClaimRequestId): boolean {
  return left.value === right.value;
}
