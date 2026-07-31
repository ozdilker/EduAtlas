/**
 * Firestore document shape for education catalog collections.
 */
export type FirestoreEducationCatalogDocument = {
  kind: string;
  slug: string;
  name: string;
  description: string;
  parentId?: string;
  order: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};
