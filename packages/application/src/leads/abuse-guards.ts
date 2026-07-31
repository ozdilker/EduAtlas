/**
 * Placeholder spam protection gate (honeypot / bot signals).
 * Returns true when the submission should be rejected as spam.
 */
export function isLeadSpamSubmission(input: { honeypot?: string }): boolean {
  return Boolean(input.honeypot?.trim());
}

/**
 * Placeholder rate-limit gate.
 * Always allows in this sprint; real IP/institution counters ship later.
 */
export function isLeadRateLimited(_input: {
  institutionId: string;
  phone?: string;
  clientKey?: string;
}): boolean {
  return false;
}
