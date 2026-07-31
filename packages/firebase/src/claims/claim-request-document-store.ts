import type { FirestoreClaimRequestDocument } from "./firestore-claim-request-document";

export type ClaimRequestDocumentRecord = {
  id: string;
  data: FirestoreClaimRequestDocument;
};

/**
 * Persistence store for claim request documents (Firestore or in-memory).
 */
export interface ClaimRequestDocumentStore {
  getById(id: string): Promise<ClaimRequestDocumentRecord | null>;
  listByInstitutionId(institutionId: string): Promise<ClaimRequestDocumentRecord[]>;
  /** Newest-first listing for admin queues (optional status filter applied in repository). */
  listAll(): Promise<ClaimRequestDocumentRecord[]>;
  create(id: string, data: FirestoreClaimRequestDocument): Promise<void>;
  replace(id: string, data: FirestoreClaimRequestDocument): Promise<void>;
}
