import type { Lead, LeadId, LeadStatus } from "@eduatlas/domain";

/**
 * Persistence port for Lead aggregates.
 * Infrastructure adapters implement this — no Firebase in this package.
 */
export interface LeadRepository {
  /**
   * Loads a lead by id, or `null` when missing.
   */
  getById(id: LeadId): Promise<Lead | null>;

  /**
   * Lists leads for an institution, newest first.
   */
  listByInstitutionId(institutionId: string): Promise<readonly Lead[]>;

  /**
   * Persists a new lead.
   */
  save(lead: Lead): Promise<Lead>;

  /**
   * Updates lead status (and updatedAt).
   */
  updateStatus(id: LeadId, status: LeadStatus): Promise<Lead>;
}
