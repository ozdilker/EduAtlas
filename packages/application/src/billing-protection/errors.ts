import type { BillingProtectionState } from "@eduatlas/domain";
import type { BillingProtectedOperation } from "./operations";

export class BillingProtectionError extends Error {
  readonly code = "OPERATION_BLOCKED_BY_BILLING_PROTECTION" as const;
  readonly operation: BillingProtectedOperation;
  readonly protectionState: BillingProtectionState;

  constructor(input: {
    readonly operation: BillingProtectedOperation;
    readonly protectionState: BillingProtectionState;
    readonly message?: string;
  }) {
    super(
      input.message ??
        `Operation ${input.operation} is blocked while billing protection is ${input.protectionState}.`,
    );
    this.name = "BillingProtectionError";
    this.operation = input.operation;
    this.protectionState = input.protectionState;
  }
}

export function isBillingProtectionError(error: unknown): error is BillingProtectionError {
  return error instanceof BillingProtectionError;
}
