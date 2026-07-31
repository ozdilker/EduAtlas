import type { Firestore } from "firebase-admin/firestore";
import type {
  EducationCatalogDocumentRecord,
  EducationCatalogDocumentStore,
} from "./education-catalog-document-store";
import type { FirestoreEducationCatalogDocument } from "./firestore-education-catalog-document";

export class FirestoreEducationCatalogDocumentStore implements EducationCatalogDocumentStore {
  constructor(
    private readonly firestore: Firestore,
    private readonly collectionId: string,
  ) {}

  async getById(id: string): Promise<EducationCatalogDocumentRecord | null> {
    const snap = await this.firestore.collection(this.collectionId).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return { id: snap.id, data: snap.data() as FirestoreEducationCatalogDocument };
  }

  async findBySlug(slug: string): Promise<EducationCatalogDocumentRecord | null> {
    const snap = await this.firestore
      .collection(this.collectionId)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    const doc = snap.docs[0];
    return doc ? { id: doc.id, data: doc.data() as FirestoreEducationCatalogDocument } : null;
  }

  async listAll(): Promise<readonly EducationCatalogDocumentRecord[]> {
    const snap = await this.firestore.collection(this.collectionId).get();
    return Object.freeze(
      snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as FirestoreEducationCatalogDocument,
      })),
    );
  }

  async upsert(id: string, data: FirestoreEducationCatalogDocument): Promise<void> {
    await this.firestore.collection(this.collectionId).doc(id).set(data, { merge: true });
  }
}
