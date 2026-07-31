import type { Firestore } from "firebase-admin/firestore";
import { CITIES_COLLECTION, type FirestoreCityDocument } from "./firestore-city-document";
import type { CityDocumentRecord, CityDocumentStore } from "./geography-document-store";
import { TtlCache, CACHE_TTL_MS } from "../cache";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export class FirestoreCityDocumentStore implements CityDocumentStore {
  private readonly listAllCache = new TtlCache<readonly CityDocumentRecord[]>(CACHE_TTL_MS.cities);
  constructor(private readonly firestore: Firestore) {}

  async getById(id: string): Promise<CityDocumentRecord | null> {
    countFirestoreRead();
    const snap = await this.firestore.collection(CITIES_COLLECTION).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return { id: snap.id, data: snap.data() as FirestoreCityDocument };
  }

  async findBySlug(slug: string): Promise<CityDocumentRecord | null> {
    countFirestoreRead();
    const snap = await this.firestore
      .collection(CITIES_COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    const doc = snap.docs[0];
    return doc ? { id: doc.id, data: doc.data() as FirestoreCityDocument } : null;
  }

  async findByPlateCode(plateCode: string): Promise<CityDocumentRecord | null> {
    countFirestoreRead();
    const snap = await this.firestore
      .collection(CITIES_COLLECTION)
      .where("plateCode", "==", plateCode)
      .limit(1)
      .get();
    const doc = snap.docs[0];
    return doc ? { id: doc.id, data: doc.data() as FirestoreCityDocument } : null;
  }

  async listAll(): Promise<readonly CityDocumentRecord[]> {
    return this.listAllCache.getOrLoad("all", async () => {
      countFirestoreRead();
      const snap = await this.firestore.collection(CITIES_COLLECTION).get();
      return Object.freeze(
        snap.docs.map((doc) => ({
          id: doc.id,
          data: doc.data() as FirestoreCityDocument,
        })),
      );
    });
  }

  async upsert(id: string, data: FirestoreCityDocument): Promise<void> {
    countFirestoreWrite();
    await this.firestore.collection(CITIES_COLLECTION).doc(id).set(data, { merge: true });
    this.listAllCache.clear();
  }
}
