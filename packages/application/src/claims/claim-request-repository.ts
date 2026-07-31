import type { ClaimRequest, ClaimRequestId, ClaimRequestStatus } from "@eduatlas/domain";

export type ListRecentClaimRequestsOptions = Readonly<{
  readonly status?: ClaimRequestStatus;
  readonly limit?: number;
}>;

/**
 * Persistence port for ClaimRequest aggregates.
 * Infrastructure adapters implement this — no Firebase in this package.
 */
export interface ClaimRequestRepository {
  /**
   * Loads a claim request by id, or `null` when missing.
   */
  getById(id: ClaimRequestId): Promise<ClaimRequest | null>;

  /**
   * Lists claim requests for an institution, newest first.
   */
  listByInstitutionId(institutionId: string): Promise<readonly ClaimRequest[]>;

  /**
   * Lists recent claim requests (newest first), optionally filtered by status.
   */
  listRecent(options?: ListRecentClaimRequestsOptions): Promise<readonly ClaimRequest[]>;

  /**
   * Persists a new claim request.
   */
  save(claimRequest: ClaimRequest): Promise<ClaimRequest>;

  /**
   * Updates claim request status (and updatedAt).
   */
  updateStatus(id: ClaimRequestId, status: ClaimRequestStatus): Promise<ClaimRequest>;
}
