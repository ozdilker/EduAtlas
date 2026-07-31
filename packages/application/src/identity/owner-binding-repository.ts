import type { OwnerBinding } from "@eduatlas/domain";

/**
 * Port for claim → owner user binding lookup and Admin approval writes.
 */
export interface OwnerBindingRepository {
  findApprovedByUserId(userId: string): Promise<OwnerBinding | null>;
  /** Reverse lookup for lead/claim notification targeting. */
  findApprovedByInstitutionId(institutionId: string): Promise<OwnerBinding | null>;
  listByUserId(userId: string): Promise<readonly OwnerBinding[]>;
  /** Upserts binding (Admin claim approval). */
  save(binding: OwnerBinding): Promise<OwnerBinding>;
}
