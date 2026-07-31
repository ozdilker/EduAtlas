import type { QualityDimension } from "./quality-dimension";

export enum QualityIssueSeverity {
  Critical = "critical",
  Major = "major",
  Minor = "minor",
}

/**
 * A single quality gap or trust flag for an institution.
 */
export type QualityIssue = Readonly<{
  readonly code: string;
  readonly dimension: QualityDimension;
  readonly severity: QualityIssueSeverity;
  readonly message: string;
  readonly field?: string;
}>;

export type CreateQualityIssueInput = {
  code: string;
  dimension: QualityDimension;
  severity: QualityIssueSeverity;
  message: string;
  field?: string;
};

export function createQualityIssue(input: CreateQualityIssueInput): QualityIssue {
  const code = input.code.trim();
  const message = input.message.trim();
  const field = input.field?.trim();

  if (!code) {
    throw new Error("QualityIssue.code is required.");
  }
  if (!message) {
    throw new Error("QualityIssue.message is required.");
  }

  return Object.freeze({
    code,
    dimension: input.dimension,
    severity: input.severity,
    message,
    ...(field ? { field } : {}),
  });
}
