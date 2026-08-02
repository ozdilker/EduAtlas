export type SmtpFailureClass = "hard_bounce" | "transient" | "unknown";

const HARD_PATTERNS = [
  /user unknown/i,
  /mailbox unavailable/i,
  /invalid recipient/i,
  /recipient rejected/i,
  /550\s*5\.1\.1/i,
  /\b551\b/,
  /\b553\b/,
  /no such user/i,
  /does not exist/i,
];

const TRANSIENT_PATTERNS = [
  /timeout/i,
  /\b421\b/,
  /\b450\b/,
  /\b451\b/,
  /\b452\b/,
  /try again/i,
  /greylist/i,
  /connection/i,
  /temporarily/i,
  /rate limit/i,
];

/**
 * Classifies SMTP/provider errors for bounce vs retry.
 * Unknown → treat as transient (safer than permanent drop).
 */
export function classifySmtpError(error: unknown): SmtpFailureClass {
  const text =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === "string"
        ? error
        : String(error ?? "");

  if (HARD_PATTERNS.some((re) => re.test(text))) {
    return "hard_bounce";
  }
  if (TRANSIENT_PATTERNS.some((re) => re.test(text))) {
    return "transient";
  }
  return "unknown";
}
