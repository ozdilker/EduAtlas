export class OutreachValidationError extends Error {
  readonly code = "OUTREACH_VALIDATION" as const;

  constructor(message: string) {
    super(message);
    this.name = "OutreachValidationError";
  }
}

export class OutreachNotFoundError extends Error {
  readonly code = "OUTREACH_NOT_FOUND" as const;

  constructor(message: string) {
    super(message);
    this.name = "OutreachNotFoundError";
  }
}

export function isOutreachValidationError(error: unknown): error is OutreachValidationError {
  return error instanceof OutreachValidationError;
}

export function isOutreachNotFoundError(error: unknown): error is OutreachNotFoundError {
  return error instanceof OutreachNotFoundError;
}
