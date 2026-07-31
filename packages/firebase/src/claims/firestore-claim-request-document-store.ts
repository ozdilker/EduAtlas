import type { Firestore } from "firebase-admin/firestore";
import type {
  ClaimRequestDocumentRecord,
  ClaimRequestDocumentStore,
} from "./claim-request-document-store";
import {
  CLAIM_REQUESTS_COLLECTION,
  type FirestoreClaimRequestDocument,
} from "./firestore-claim-request-document";
import { FirestoreClaimRequestMapper } from "./firestore-claim-request-mapper";

/**
 * Admin Firestore-backed document store for `claim_requests`.
 */
export class FirestoreClaimRequestDocumentStore implements ClaimRequestDocumentStore {
  constructor(
    private readonly db: Firestore,
    private readonly collectionPath: string = CLAIM_REQUESTS_COLLECTION,
  ) {}

  async getById(id: string): Promise<ClaimRequestDocumentRecord | null> {
    const snapshot = await this.collection().doc(id).get();
    if (!snapshot.exists) {
      return null;
    }

    return {
      id: snapshot.id,
      data: FirestoreClaimRequestMapper.parseDocument(snapshot.data()),
    };
  }

  async listByInstitutionId(institutionId: string): Promise<ClaimRequestDocumentRecord[]> {
    const snapshot = await this.collection().where("institutionId", "==", institutionId).get();

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        data: FirestoreClaimRequestMapper.parseDocument(doc.data()),
      }))
      .sort((left, right) => right.data.createdAt.localeCompare(left.data.createdAt));
  }

  async listAll(): Promise<ClaimRequestDocumentRecord[]> {
    const snapshot = await this.collection().get();
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        data: FirestoreClaimRequestMapper.parseDocument(doc.data()),
      }))
      .sort((left, right) => right.data.createdAt.localeCompare(left.data.createdAt));
  }

  async create(id: string, data: FirestoreClaimRequestDocument): Promise<void> {
    const ref = this.collection().doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      throw new Error(`CLAIM_REQUEST_DOC_EXISTS:${id}`);
    }
    await ref.create(data);
  }

  async replace(id: string, data: FirestoreClaimRequestDocument): Promise<void> {
    await this.collection().doc(id).set(data, { merge: false });
  }

  private collection() {
    return this.db.collection(this.collectionPath);
  }
}
