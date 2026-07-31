import type { FirestoreLeadDocument } from "./firestore-lead-document";
import type { LeadDocumentRecord, LeadDocumentStore } from "./lead-document-store";

/**
 * In-memory lead document store for tests and local fallbacks.
 */
export class InMemoryLeadDocumentStore implements LeadDocumentStore {
  private readonly docs = new Map<string, FirestoreLeadDocument>();

  async getById(id: string): Promise<LeadDocumentRecord | null> {
    const data = this.docs.get(id);
    return data ? { id, data } : null;
  }

  async listByInstitutionId(institutionId: string): Promise<LeadDocumentRecord[]> {
    return [...this.docs.entries()]
      .filter(([, data]) => data.institutionId === institutionId)
      .map(([id, data]) => ({ id, data }))
      .sort((left, right) => right.data.createdAt.localeCompare(left.data.createdAt));
  }

  async create(id: string, data: FirestoreLeadDocument): Promise<void> {
    if (this.docs.has(id)) {
      throw new Error(`LEAD_DOC_EXISTS:${id}`);
    }
    this.docs.set(id, data);
  }

  async replace(id: string, data: FirestoreLeadDocument): Promise<void> {
    this.docs.set(id, data);
  }
}
