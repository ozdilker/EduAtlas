export class LeadValidationError extends Error {
  readonly code = "LEAD_VALIDATION_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "LeadValidationError";
  }
}

export class LeadSpamRejectedError extends Error {
  readonly code = "LEAD_SPAM_REJECTED" as const;

  constructor(message = "Lead submission rejected by spam protection.") {
    super(message);
    this.name = "LeadSpamRejectedError";
  }
}

export class LeadRateLimitedError extends Error {
  readonly code = "LEAD_RATE_LIMITED" as const;

  constructor(message = "Lead submission rate limit exceeded.") {
    super(message);
    this.name = "LeadRateLimitedError";
  }
}

export class LeadInstitutionNotFoundError extends Error {
  readonly code = "LEAD_INSTITUTION_NOT_FOUND" as const;

  constructor(institutionId: string) {
    super(`Institution not found for lead submission: ${institutionId}`);
    this.name = "LeadInstitutionNotFoundError";
  }
}

export class LeadNotFoundError extends Error {
  readonly code = "LEAD_NOT_FOUND" as const;

  constructor(leadId: string) {
    super(`Lead not found: ${leadId}`);
    this.name = "LeadNotFoundError";
  }
}

export function isLeadValidationError(error: unknown): error is LeadValidationError {
  return error instanceof LeadValidationError;
}

export function isLeadSpamRejectedError(error: unknown): error is LeadSpamRejectedError {
  return error instanceof LeadSpamRejectedError;
}

export function isLeadRateLimitedError(error: unknown): error is LeadRateLimitedError {
  return error instanceof LeadRateLimitedError;
}

export function isLeadNotFoundError(error: unknown): error is LeadNotFoundError {
  return error instanceof LeadNotFoundError;
}
