import type { FirestoreEducationCatalogDocument } from "./firestore-education-catalog-document";

export type EducationCatalogDocumentRecord = Readonly<{
  readonly id: string;
  readonly data: FirestoreEducationCatalogDocument;
}>;

export interface EducationCatalogDocumentStore {
  getById(id: string): Promise<EducationCatalogDocumentRecord | null>;
  findBySlug(slug: string): Promise<EducationCatalogDocumentRecord | null>;
  listAll(): Promise<readonly EducationCatalogDocumentRecord[]>;
  upsert(id: string, data: FirestoreEducationCatalogDocument): Promise<void>;
}
