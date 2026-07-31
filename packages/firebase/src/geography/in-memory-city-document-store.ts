import type { FirestoreCityDocument } from "./firestore-city-document";
import type { CityDocumentRecord, CityDocumentStore } from "./geography-document-store";

export class InMemoryCityDocumentStore implements CityDocumentStore {
  private readonly byId = new Map<string, FirestoreCityDocument>();

  async getById(id: string): Promise<CityDocumentRecord | null> {
    const data = this.byId.get(id);
    return data ? { id, data } : null;
  }

  async findBySlug(slug: string): Promise<CityDocumentRecord | null> {
    for (const [id, data] of this.byId) {
      if (data.slug === slug) {
        return { id, data };
      }
    }
    return null;
  }

  async findByPlateCode(plateCode: string): Promise<CityDocumentRecord | null> {
    for (const [id, data] of this.byId) {
      if (data.plateCode === plateCode) {
        return { id, data };
      }
    }
    return null;
  }

  async listAll(): Promise<readonly CityDocumentRecord[]> {
    return Object.freeze([...this.byId.entries()].map(([id, data]) => ({ id, data })));
  }

  async upsert(id: string, data: FirestoreCityDocument): Promise<void> {
    this.byId.set(id, data);
  }
}
