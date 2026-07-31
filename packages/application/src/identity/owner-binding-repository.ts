import type { OwnerBinding } from "@eduatlas/domain";

/**
 * Port for claim → owner user binding lookup.
 * Writes happen only via Admin approval flows (not auto-bind on login).
 */
export interface OwnerBindingRepository {
  findApprovedByUserId(userId: string): Promise<OwnerBinding | null>;
  /** Reverse lookup for lead/claim notification targeting. */
  findApprovedByInstitutionId(institutionId: string): Promise<OwnerBinding | null>;
  listByUserId(userId: string): Promise<readonly OwnerBinding[]>;
}
