import type { FirestoreInstitutionDocument } from "./firestore-institution-document";

export type InstitutionDocumentRecord = {
  id: string;
  data: FirestoreInstitutionDocument;
};

/**
 * Persistence gateway used by FirestoreInstitutionRepository.
 * Real Firestore and in-memory fakes both implement this — keeps mapping in one place.
 */
export interface InstitutionDocumentStore {
  getById(id: string): Promise<InstitutionDocumentRecord | null>;
  findBySlug(slug: string): Promise<InstitutionDocumentRecord | null>;
  listAll(): Promise<InstitutionDocumentRecord[]>;
  /**
   * Optional type-scoped listing — avoids downloading the full catalog for category hubs.
   */
  listByPrimaryType?(primaryTypeId: string): Promise<InstitutionDocumentRecord[]>;
  /**
   * Optional geography-scoped listing — avoids downloading the full catalog for city landing pages.
   */
  listByCityId?(cityId: string): Promise<InstitutionDocumentRecord[]>;
  /**
   * Optional geography-scoped listing — avoids downloading the full catalog for district landing pages.
   */
  listByDistrictId?(districtId: string): Promise<InstitutionDocumentRecord[]>;
  create(id: string, data: FirestoreInstitutionDocument): Promise<void>;
  /**
   * Creates many docs in as few round-trips as possible (Firestore WriteBatch).
   * Implementations may fall back to sequential create.
   */
  createMany?(
    entries: readonly { id: string; data: FirestoreInstitutionDocument }[],
  ): Promise<void>;
  replace(id: string, data: FirestoreInstitutionDocument): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
