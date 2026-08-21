import { createHash } from "node:crypto";

/**
 * Stable synthetic institution id for external-import recipients (not in the catalog).
 * Used as CampaignRecipient.institutionId / DeliveryJob.institutionId for idempotency.
 */
export function buildExternalInstitutionId(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("buildExternalInstitutionId requires a valid email.");
  }
  const hash = createHash("sha256").update(normalized).digest("hex").slice(0, 24);
  return `ext:${hash}`;
}

export function isExternalInstitutionId(institutionId: string): boolean {
  return institutionId.trim().startsWith("ext:");
}
