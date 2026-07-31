import type { FirestoreLeadDocument } from "./firestore-lead-document";

export type LeadDocumentRecord = {
  id: string;
  data: FirestoreLeadDocument;
};

/**
 * Persistence gateway used by FirestoreLeadRepository.
 */
export interface LeadDocumentStore {
  getById(id: string): Promise<LeadDocumentRecord | null>;
  listByInstitutionId(institutionId: string): Promise<LeadDocumentRecord[]>;
  create(id: string, data: FirestoreLeadDocument): Promise<void>;
  replace(id: string, data: FirestoreLeadDocument): Promise<void>;
}
