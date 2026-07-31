import type { FirestoreInstitutionDocument } from "./firestore-institution-document";
import type {
  InstitutionDocumentRecord,
  InstitutionDocumentStore,
} from "./institution-document-store";

/**
 * In-memory InstitutionDocumentStore for contract tests (no Firebase emulator required).
 */
export class InMemoryInstitutionDocumentStore implements InstitutionDocumentStore {
  private readonly documents = new Map<string, FirestoreInstitutionDocument>();

  async getById(id: string): Promise<InstitutionDocumentRecord | null> {
    const data = this.documents.get(id);
    return data ? { id, data: structuredClone(data) } : null;
  }

  async findBySlug(slug: string): Promise<InstitutionDocumentRecord | null> {
    for (const [id, data] of this.documents.entries()) {
      if (data.slug === slug) {
        return { id, data: structuredClone(data) };
      }
    }
    return null;
  }

  async listAll(): Promise<InstitutionDocumentRecord[]> {
    return [...this.documents.entries()].map(([id, data]) => ({
      id,
      data: structuredClone(data),
    }));
  }

  async listByPrimaryType(primaryTypeId: string): Promise<InstitutionDocumentRecord[]> {
    const typeId = primaryTypeId.trim();
    return [...this.documents.entries()]
      .filter(([, data]) => data.primaryTypeId === typeId)
      .map(([id, data]) => ({
        id,
        data: structuredClone(data),
      }));
  }

  async listByCityId(cityId: string): Promise<InstitutionDocumentRecord[]> {
    const normalized = cityId.trim();
    if (!normalized) {
      return [];
    }

    return [...this.documents.entries()]
      .filter(([, data]) => data.cityId === normalized)
      .map(([id, data]) => ({
        id,
        data: structuredClone(data),
      }));
  }

  async listByDistrictId(districtId: string): Promise<InstitutionDocumentRecord[]> {
    const normalized = districtId.trim();
    if (!normalized) {
      return [];
    }

    return [...this.documents.entries()]
      .filter(([, data]) => data.districtId === normalized)
      .map(([id, data]) => ({
        id,
        data: structuredClone(data),
      }));
  }

  async create(id: string, data: FirestoreInstitutionDocument): Promise<void> {
    if (this.documents.has(id)) {
      throw new Error(`INSTITUTION_DOC_EXISTS:${id}`);
    }
    this.documents.set(id, structuredClone(data));
  }

  async createMany(
    entries: readonly { id: string; data: FirestoreInstitutionDocument }[],
  ): Promise<void> {
    for (const entry of entries) {
      await this.create(entry.id, entry.data);
    }
  }

  async replace(id: string, data: FirestoreInstitutionDocument): Promise<void> {
    this.documents.set(id, structuredClone(data));
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.documents.has(id);
  }
}
