/**
 * Operations that may incur large Firestore catalog reads / third-party spend.
 * Gate these via assertOperationAllowed — never via global middleware.
 */
export const BILLING_PROTECTED_OPERATIONS = [
  "SITEMAP_SCAN",
  "IMPORT_DUPLICATE_SCAN",
  "ACQUISITION_FULL_SCAN",
  "OUTREACH_PREPARE",
  "ADMIN_FREE_TEXT",
  "AI_HEAVY_OPERATION",
] as const;

export type BillingProtectedOperation = (typeof BILLING_PROTECTED_OPERATIONS)[number];

/** Blocked starting at PROTECTION (and EMERGENCY). */
const PROTECTION_BLOCKED = new Set<BillingProtectedOperation>([
  "SITEMAP_SCAN",
  "IMPORT_DUPLICATE_SCAN",
  "ACQUISITION_FULL_SCAN",
  "OUTREACH_PREPARE",
  "ADMIN_FREE_TEXT",
]);

/** Additional blocks only in EMERGENCY. */
const EMERGENCY_ONLY_BLOCKED = new Set<BillingProtectedOperation>(["AI_HEAVY_OPERATION"]);

export function isBillingOperationBlocked(
  state: "NORMAL" | "WARNING" | "PROTECTION" | "EMERGENCY",
  operation: BillingProtectedOperation,
): boolean {
  if (state === "NORMAL" || state === "WARNING") {
    return false;
  }
  if (state === "PROTECTION") {
    return PROTECTION_BLOCKED.has(operation);
  }
  // EMERGENCY
  return PROTECTION_BLOCKED.has(operation) || EMERGENCY_ONLY_BLOCKED.has(operation);
}
