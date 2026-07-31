export class ClaimValidationError extends Error {
  readonly code = "CLAIM_VALIDATION_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "ClaimValidationError";
  }
}

export class ClaimSpamRejectedError extends Error {
  readonly code = "CLAIM_SPAM_REJECTED" as const;

  constructor(message = "Claim submission rejected by spam protection.") {
    super(message);
    this.name = "ClaimSpamRejectedError";
  }
}

export class ClaimRateLimitedError extends Error {
  readonly code = "CLAIM_RATE_LIMITED" as const;

  constructor(message = "Claim submission rate limit exceeded.") {
    super(message);
    this.name = "ClaimRateLimitedError";
  }
}

export class ClaimInstitutionNotFoundError extends Error {
  readonly code = "CLAIM_INSTITUTION_NOT_FOUND" as const;

  constructor(institutionId: string) {
    super(`Institution not found for claim submission: ${institutionId}`);
    this.name = "ClaimInstitutionNotFoundError";
  }
}

export function isClaimValidationError(error: unknown): error is ClaimValidationError {
  return error instanceof ClaimValidationError;
}

export function isClaimSpamRejectedError(error: unknown): error is ClaimSpamRejectedError {
  return error instanceof ClaimSpamRejectedError;
}

export function isClaimRateLimitedError(error: unknown): error is ClaimRateLimitedError {
  return error instanceof ClaimRateLimitedError;
}
