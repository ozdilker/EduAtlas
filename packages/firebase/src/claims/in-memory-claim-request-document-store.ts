import type {
  ClaimRequestDocumentRecord,
  ClaimRequestDocumentStore,
} from "./claim-request-document-store";
import type { FirestoreClaimRequestDocument } from "./firestore-claim-request-document";

/**
 * In-memory claim request document store for tests and local fallbacks.
 */
export class InMemoryClaimRequestDocumentStore implements ClaimRequestDocumentStore {
  private readonly docs = new Map<string, FirestoreClaimRequestDocument>();

  async getById(id: string): Promise<ClaimRequestDocumentRecord | null> {
    const data = this.docs.get(id);
    return data ? { id, data } : null;
  }

  async listByInstitutionId(institutionId: string): Promise<ClaimRequestDocumentRecord[]> {
    return [...this.docs.entries()]
      .filter(([, data]) => data.institutionId === institutionId)
      .map(([id, data]) => ({ id, data }))
      .sort((left, right) => right.data.createdAt.localeCompare(left.data.createdAt));
  }

  async listAll(): Promise<ClaimRequestDocumentRecord[]> {
    return [...this.docs.entries()]
      .map(([id, data]) => ({ id, data }))
      .sort((left, right) => right.data.createdAt.localeCompare(left.data.createdAt));
  }

  async create(id: string, data: FirestoreClaimRequestDocument): Promise<void> {
    if (this.docs.has(id)) {
      throw new Error(`CLAIM_REQUEST_DOC_EXISTS:${id}`);
    }
    this.docs.set(id, data);
  }

  async replace(id: string, data: FirestoreClaimRequestDocument): Promise<void> {
    this.docs.set(id, data);
  }
}
