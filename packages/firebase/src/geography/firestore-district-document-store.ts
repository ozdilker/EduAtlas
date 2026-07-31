import type { Firestore } from "firebase-admin/firestore";
import {
  DISTRICTS_COLLECTION,
  type FirestoreDistrictDocument,
} from "./firestore-district-document";
import type { DistrictDocumentRecord, DistrictDocumentStore } from "./geography-document-store";
import { TtlCache, CACHE_TTL_MS } from "../cache";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export class FirestoreDistrictDocumentStore implements DistrictDocumentStore {
  private readonly listAllCache = new TtlCache<readonly DistrictDocumentRecord[]>(
    CACHE_TTL_MS.districts,
  );
  constructor(private readonly firestore: Firestore) {}

  async getById(id: string): Promise<DistrictDocumentRecord | null> {
    countFirestoreRead();
    const snap = await this.firestore.collection(DISTRICTS_COLLECTION).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return { id: snap.id, data: snap.data() as FirestoreDistrictDocument };
  }

  async findByCityAndSlug(cityId: string, slug: string): Promise<DistrictDocumentRecord | null> {
    countFirestoreRead();
    const snap = await this.firestore
      .collection(DISTRICTS_COLLECTION)
      .where("cityId", "==", cityId)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    const doc = snap.docs[0];
    return doc ? { id: doc.id, data: doc.data() as FirestoreDistrictDocument } : null;
  }

  async listByCityId(cityId: string): Promise<readonly DistrictDocumentRecord[]> {
    countFirestoreRead();
    const snap = await this.firestore
      .collection(DISTRICTS_COLLECTION)
      .where("cityId", "==", cityId)
      .get();
    return Object.freeze(
      snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as FirestoreDistrictDocument,
      })),
    );
  }

  async listAll(): Promise<readonly DistrictDocumentRecord[]> {
    return this.listAllCache.getOrLoad("all", async () => {
      countFirestoreRead();
      const snap = await this.firestore.collection(DISTRICTS_COLLECTION).get();
      return Object.freeze(
        snap.docs.map((doc) => ({
          id: doc.id,
          data: doc.data() as FirestoreDistrictDocument,
        })),
      );
    });
  }

  async upsert(id: string, data: FirestoreDistrictDocument): Promise<void> {
    countFirestoreWrite();
    await this.firestore.collection(DISTRICTS_COLLECTION).doc(id).set(data, { merge: true });
    this.listAllCache.clear();
  }
}
