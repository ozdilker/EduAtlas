import type { DistrictListOptions, DistrictRepository } from "@eduatlas/application";
import { type District, GeoLifecycleStatus, normalizeGeographySlug } from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { FirestoreDistrictDocumentStore } from "./firestore-district-document-store";
import { FirestoreDistrictMapper } from "./firestore-geography-mapper";
import type { DistrictDocumentStore } from "./geography-document-store";
import { filterDistrictsByQuery } from "./turkey-geography-seed";

export type FirestoreDistrictRepositoryOptions = {
  firestore?: Firestore;
  store?: DistrictDocumentStore;
};

/**
 * Firestore adapter for DistrictRepository (read-oriented; upsert for seeding).
 */
export class FirestoreDistrictRepository implements DistrictRepository {
  private readonly store: DistrictDocumentStore;

  constructor(options: FirestoreDistrictRepositoryOptions) {
    if (options.store) {
      this.store = options.store;
    } else if (options.firestore) {
      this.store = new FirestoreDistrictDocumentStore(options.firestore);
    } else {
      throw new Error("FirestoreDistrictRepository requires firestore or store.");
    }
  }

  async getById(id: string): Promise<District | null> {
    const record = await this.store.getById(id.trim());
    return record ? FirestoreDistrictMapper.toDomain(record.id, record.data) : null;
  }

  async getBySlug(cityId: string, slug: string): Promise<District | null> {
    const record = await this.store.findByCityAndSlug(cityId.trim(), normalizeGeographySlug(slug));
    return record ? FirestoreDistrictMapper.toDomain(record.id, record.data) : null;
  }

  async listByCityId(
    cityId: string,
    options: DistrictListOptions = {},
  ): Promise<readonly District[]> {
    const records = await this.store.listByCityId(cityId.trim());
    let districts = records.flatMap((record) => {
      try {
        return [FirestoreDistrictMapper.toDomain(record.id, record.data)];
      } catch {
        return [];
      }
    });

    if (options.lifecycleStatus) {
      districts = districts.filter(
        (district) => district.lifecycleStatus === options.lifecycleStatus,
      );
    } else {
      districts = districts.filter(
        (district) => district.lifecycleStatus === GeoLifecycleStatus.Published,
      );
    }

    districts = [...filterDistrictsByQuery(districts, options.query)];
    districts.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.nameTr.localeCompare(right.nameTr, "tr"),
    );

    return Object.freeze(districts);
  }

  async search(query: string, cityId?: string): Promise<readonly District[]> {
    if (cityId?.trim()) {
      return this.listByCityId(cityId, { query });
    }

    const records = await this.store.listAll();
    let districts = records.flatMap((record) => {
      try {
        return [FirestoreDistrictMapper.toDomain(record.id, record.data)];
      } catch {
        return [];
      }
    });
    districts = districts.filter(
      (district) => district.lifecycleStatus === GeoLifecycleStatus.Published,
    );
    districts = [...filterDistrictsByQuery(districts, query)];
    districts.sort((left, right) => left.nameTr.localeCompare(right.nameTr, "tr"));
    return Object.freeze(districts);
  }

  /** Seeding / admin upsert — not exposed via application read services. */
  async upsert(district: District): Promise<District> {
    await this.store.upsert(
      FirestoreDistrictMapper.districtDocId(district),
      FirestoreDistrictMapper.toFirestore(district),
    );
    return district;
  }
}

export function createFirestoreDistrictRepository(
  firestore: Firestore,
): FirestoreDistrictRepository {
  return new FirestoreDistrictRepository({ firestore });
}
