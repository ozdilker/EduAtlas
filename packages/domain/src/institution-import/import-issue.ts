/**
 * Severity of an import row issue.
 */
export enum ImportIssueSeverity {
  /** Row cannot be imported until fixed. */
  Error = "error",
  /** Row can be imported but needs attention. */
  Warning = "warning",
}

/**
 * Single validation/duplicate finding attached to an import row.
 */
export type ImportIssue = Readonly<{
  readonly severity: ImportIssueSeverity;
  readonly field?: string;
  readonly message: string;
}>;

export type CreateImportIssueInput = {
  severity: ImportIssueSeverity;
  field?: string;
  message: string;
};

export function createImportIssue(input: CreateImportIssueInput): ImportIssue {
  const message = input.message.trim();
  if (!message) {
    throw new Error("ImportIssue.message is required.");
  }
  const field = input.field?.trim();
  return Object.freeze({
    severity: input.severity,
    ...(field ? { field } : {}),
    message,
  });
}

export function importIssueError(field: string, message: string): ImportIssue {
  return createImportIssue({ severity: ImportIssueSeverity.Error, field, message });
}

export function importIssueWarning(field: string, message: string): ImportIssue {
  return createImportIssue({ severity: ImportIssueSeverity.Warning, field, message });
}

export function hasImportErrors(issues: readonly ImportIssue[]): boolean {
  return issues.some((issue) => issue.severity === ImportIssueSeverity.Error);
}
