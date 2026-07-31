/**
 * Placeholder spam protection gate (honeypot / bot signals).
 * Returns true when the submission should be rejected as spam.
 */
export function isClaimSpamSubmission(input: { honeypot?: string }): boolean {
  return Boolean(input.honeypot?.trim());
}

/**
 * Placeholder rate-limit gate.
 * Always allows in this sprint; real IP/user counters ship later.
 */
export function isClaimRateLimited(_input: {
  institutionId: string;
  email?: string;
  phone?: string;
  clientKey?: string;
}): boolean {
  return false;
}
