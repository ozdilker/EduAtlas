import type { CityListOptions, CityRepository } from "@eduatlas/application";
import { type City, GeoLifecycleStatus, normalizeGeographySlug } from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { FirestoreCityDocumentStore } from "./firestore-city-document-store";
import { FirestoreCityMapper } from "./firestore-geography-mapper";
import type { CityDocumentStore } from "./geography-document-store";
import { filterCitiesByQuery } from "./turkey-geography-seed";

export type FirestoreCityRepositoryOptions = {
  firestore?: Firestore;
  store?: CityDocumentStore;
};

/**
 * Firestore adapter for CityRepository (read-oriented; upsert for seeding).
 */
export class FirestoreCityRepository implements CityRepository {
  private readonly store: CityDocumentStore;

  constructor(options: FirestoreCityRepositoryOptions) {
    if (options.store) {
      this.store = options.store;
    } else if (options.firestore) {
      this.store = new FirestoreCityDocumentStore(options.firestore);
    } else {
      throw new Error("FirestoreCityRepository requires firestore or store.");
    }
  }

  async getById(id: string): Promise<City | null> {
    const record = await this.store.getById(id.trim());
    return record ? FirestoreCityMapper.toDomain(record.id, record.data) : null;
  }

  async getBySlug(slug: string): Promise<City | null> {
    const record = await this.store.findBySlug(normalizeGeographySlug(slug));
    return record ? FirestoreCityMapper.toDomain(record.id, record.data) : null;
  }

  async getByPlateCode(plateCode: string): Promise<City | null> {
    const normalized = plateCode.trim().padStart(2, "0");
    const record = await this.store.findByPlateCode(normalized);
    return record ? FirestoreCityMapper.toDomain(record.id, record.data) : null;
  }

  async list(options: CityListOptions = {}): Promise<readonly City[]> {
    const records = await this.store.listAll();
    let cities = records.flatMap((record) => {
      try {
        return [FirestoreCityMapper.toDomain(record.id, record.data)];
      } catch {
        return [];
      }
    });

    if (options.lifecycleStatus) {
      cities = cities.filter((city) => city.lifecycleStatus === options.lifecycleStatus);
    } else {
      cities = cities.filter((city) => city.lifecycleStatus === GeoLifecycleStatus.Published);
    }

    if (options.isPriority !== undefined) {
      cities = cities.filter((city) => city.isPriority === options.isPriority);
    }

    cities = [...filterCitiesByQuery(cities, options.query)];
    cities.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.nameTr.localeCompare(right.nameTr, "tr"),
    );

    return Object.freeze(cities);
  }

  async search(query: string): Promise<readonly City[]> {
    return this.list({ query });
  }

  /** Seeding / admin upsert — not exposed via application read services. */
  async upsert(city: City): Promise<City> {
    await this.store.upsert(
      FirestoreCityMapper.cityDocId(city),
      FirestoreCityMapper.toFirestore(city),
    );
    return city;
  }
}

export function createFirestoreCityRepository(firestore: Firestore): FirestoreCityRepository {
  return new FirestoreCityRepository({ firestore });
}
