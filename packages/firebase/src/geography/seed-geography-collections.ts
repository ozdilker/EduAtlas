import type { Firestore } from "firebase-admin/firestore";
import { CITIES_COLLECTION } from "./firestore-city-document";
import { FirestoreCityRepository } from "./firestore-city-repository";
import { DISTRICTS_COLLECTION } from "./firestore-district-document";
import { FirestoreDistrictRepository } from "./firestore-district-repository";
import { FirestoreCityMapper, FirestoreDistrictMapper } from "./firestore-geography-mapper";
import { InMemoryCityDocumentStore } from "./in-memory-city-document-store";
import { InMemoryDistrictDocumentStore } from "./in-memory-district-document-store";
import { buildTurkeyGeographySeedCatalog } from "./turkey-geography-seed";

const BATCH_LIMIT = 400;

export type SeedGeographyCollectionsResult = Readonly<{
  readonly citiesWritten: number;
  readonly districtsWritten: number;
  readonly citiesCollection: string;
  readonly districtsCollection: string;
}>;

/**
 * Upserts Türkiye geography seed into Firestore `cities` + `districts`.
 * Geography only — no institutions.
 */
export async function seedGeographyCollections(
  firestore: Firestore,
): Promise<SeedGeographyCollectionsResult> {
  const catalog = buildTurkeyGeographySeedCatalog();

  for (let index = 0; index < catalog.cities.length; index += BATCH_LIMIT) {
    const batch = firestore.batch();
    const slice = catalog.cities.slice(index, index + BATCH_LIMIT);
    for (const city of slice) {
      const ref = firestore.collection(CITIES_COLLECTION).doc(FirestoreCityMapper.cityDocId(city));
      batch.set(ref, FirestoreCityMapper.toFirestore(city), { merge: true });
    }
    await batch.commit();
  }

  for (let index = 0; index < catalog.districts.length; index += BATCH_LIMIT) {
    const batch = firestore.batch();
    const slice = catalog.districts.slice(index, index + BATCH_LIMIT);
    for (const district of slice) {
      const ref = firestore
        .collection(DISTRICTS_COLLECTION)
        .doc(FirestoreDistrictMapper.districtDocId(district));
      batch.set(ref, FirestoreDistrictMapper.toFirestore(district), { merge: true });
    }
    await batch.commit();
  }

  const cityRepository = new FirestoreCityRepository({ firestore });
  const districtRepository = new FirestoreDistrictRepository({ firestore });
  await cityRepository.list();
  await districtRepository.listByCityId("istanbul");

  return Object.freeze({
    citiesWritten: catalog.cities.length,
    districtsWritten: catalog.districts.length,
    citiesCollection: CITIES_COLLECTION,
    districtsCollection: DISTRICTS_COLLECTION,
  });
}

/**
 * In-memory CityRepository + DistrictRepository seeded with full TR geography.
 */
export async function createSeededGeographyRepositories(): Promise<{
  cityRepository: FirestoreCityRepository;
  districtRepository: FirestoreDistrictRepository;
}> {
  const catalog = buildTurkeyGeographySeedCatalog();
  const cityStore = new InMemoryCityDocumentStore();
  const districtStore = new InMemoryDistrictDocumentStore();

  for (const city of catalog.cities) {
    await cityStore.upsert(
      FirestoreCityMapper.cityDocId(city),
      FirestoreCityMapper.toFirestore(city),
    );
  }
  for (const district of catalog.districts) {
    await districtStore.upsert(
      FirestoreDistrictMapper.districtDocId(district),
      FirestoreDistrictMapper.toFirestore(district),
    );
  }

  return {
    cityRepository: new FirestoreCityRepository({ store: cityStore }),
    districtRepository: new FirestoreDistrictRepository({ store: districtStore }),
  };
}
