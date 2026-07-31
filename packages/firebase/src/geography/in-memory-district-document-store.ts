import type { FirestoreDistrictDocument } from "./firestore-district-document";
import type { DistrictDocumentRecord, DistrictDocumentStore } from "./geography-document-store";

export class InMemoryDistrictDocumentStore implements DistrictDocumentStore {
  private readonly byId = new Map<string, FirestoreDistrictDocument>();

  async getById(id: string): Promise<DistrictDocumentRecord | null> {
    const data = this.byId.get(id);
    return data ? { id, data } : null;
  }

  async findByCityAndSlug(cityId: string, slug: string): Promise<DistrictDocumentRecord | null> {
    for (const [id, data] of this.byId) {
      if (data.cityId === cityId && data.slug === slug) {
        return { id, data };
      }
    }
    return null;
  }

  async listByCityId(cityId: string): Promise<readonly DistrictDocumentRecord[]> {
    return Object.freeze(
      [...this.byId.entries()]
        .filter(([, data]) => data.cityId === cityId)
        .map(([id, data]) => ({ id, data })),
    );
  }

  async listAll(): Promise<readonly DistrictDocumentRecord[]> {
    return Object.freeze([...this.byId.entries()].map(([id, data]) => ({ id, data })));
  }

  async upsert(id: string, data: FirestoreDistrictDocument): Promise<void> {
    this.byId.set(id, data);
  }
}
