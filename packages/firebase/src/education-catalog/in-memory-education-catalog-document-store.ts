import type {
  EducationCatalogDocumentRecord,
  EducationCatalogDocumentStore,
} from "./education-catalog-document-store";
import type { FirestoreEducationCatalogDocument } from "./firestore-education-catalog-document";

export class InMemoryEducationCatalogDocumentStore implements EducationCatalogDocumentStore {
  private readonly byId = new Map<string, FirestoreEducationCatalogDocument>();

  async getById(id: string): Promise<EducationCatalogDocumentRecord | null> {
    const data = this.byId.get(id);
    return data ? { id, data } : null;
  }

  async findBySlug(slug: string): Promise<EducationCatalogDocumentRecord | null> {
    for (const [id, data] of this.byId) {
      if (data.slug === slug) {
        return { id, data };
      }
    }
    return null;
  }

  async listAll(): Promise<readonly EducationCatalogDocumentRecord[]> {
    return Object.freeze([...this.byId.entries()].map(([id, data]) => ({ id, data })));
  }

  async upsert(id: string, data: FirestoreEducationCatalogDocument): Promise<void> {
    this.byId.set(id, data);
  }
}
