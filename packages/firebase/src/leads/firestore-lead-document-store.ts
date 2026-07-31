import type { Firestore } from "firebase-admin/firestore";
import { type FirestoreLeadDocument, LEADS_COLLECTION } from "./firestore-lead-document";
import { FirestoreLeadMapper } from "./firestore-lead-mapper";
import type { LeadDocumentRecord, LeadDocumentStore } from "./lead-document-store";

/**
 * Admin Firestore-backed document store for `leads`.
 */
export class FirestoreLeadDocumentStore implements LeadDocumentStore {
  constructor(
    private readonly db: Firestore,
    private readonly collectionPath: string = LEADS_COLLECTION,
  ) {}

  async getById(id: string): Promise<LeadDocumentRecord | null> {
    const snapshot = await this.collection().doc(id).get();
    if (!snapshot.exists) {
      return null;
    }

    return {
      id: snapshot.id,
      data: FirestoreLeadMapper.parseDocument(snapshot.data()),
    };
  }

  async listByInstitutionId(institutionId: string): Promise<LeadDocumentRecord[]> {
    const snapshot = await this.collection().where("institutionId", "==", institutionId).get();

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        data: FirestoreLeadMapper.parseDocument(doc.data()),
      }))
      .sort((left, right) => right.data.createdAt.localeCompare(left.data.createdAt));
  }

  async create(id: string, data: FirestoreLeadDocument): Promise<void> {
    const ref = this.collection().doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      throw new Error(`LEAD_DOC_EXISTS:${id}`);
    }
    await ref.create(data);
  }

  async replace(id: string, data: FirestoreLeadDocument): Promise<void> {
    await this.collection().doc(id).set(data, { merge: false });
  }

  private collection() {
    return this.db.collection(this.collectionPath);
  }
}
