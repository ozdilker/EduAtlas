import type { Firestore } from "firebase-admin/firestore";
import {
  type FirestoreInstitutionDocument,
  INSTITUTIONS_COLLECTION,
} from "./firestore-institution-document";
import { FirestoreInstitutionMapper } from "./firestore-institution-mapper";
import type {
  InstitutionDocumentRecord,
  InstitutionDocumentStore,
} from "./institution-document-store";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

/** Short in-process cache so search/list don't re-download the full catalog every call. */
const LIST_ALL_CACHE_TTL_MS = 60_000;

type ListAllCacheEntry = {
  expiresAt: number;
  records: InstitutionDocumentRecord[];
  promise?: Promise<InstitutionDocumentRecord[]>;
};

/**
 * Admin Firestore-backed document store for `institutions`.
 */
export class FirestoreInstitutionDocumentStore implements InstitutionDocumentStore {
  private listAllCache: ListAllCacheEntry | undefined;
  private readonly typeListCache = new Map<string, ListAllCacheEntry>();
  private readonly cityListCache = new Map<string, ListAllCacheEntry>();
  private readonly districtListCache = new Map<string, ListAllCacheEntry>();

  constructor(
    private readonly db: Firestore,
    private readonly collectionPath: string = INSTITUTIONS_COLLECTION,
  ) {}

  async getById(id: string): Promise<InstitutionDocumentRecord | null> {
    countFirestoreRead();
    const snapshot = await this.collection().doc(id).get();

    if (!snapshot.exists) {
      return null;
    }

    return {
      id: snapshot.id,
      data: FirestoreInstitutionMapper.parseDocument(snapshot.data()),
    };
  }

  async findBySlug(slug: string): Promise<InstitutionDocumentRecord | null> {
    countFirestoreRead();
    const snapshot = await this.collection().where("slug", "==", slug).limit(1).get();
    const doc = snapshot.docs[0];

    if (!doc) {
      return null;
    }

    return {
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    };
  }

  async listAll(): Promise<InstitutionDocumentRecord[]> {
    const now = Date.now();
    const cached = this.listAllCache;

    if (cached && cached.expiresAt > now) {
      return cached.records;
    }

    if (cached?.promise) {
      return cached.promise;
    }

    countFirestoreRead();
    const promise = this.fetchAllRecords()
      .then((records) => {
        this.listAllCache = {
          expiresAt: Date.now() + LIST_ALL_CACHE_TTL_MS,
          records,
        };
        return records;
      })
      .catch((error) => {
        this.listAllCache = undefined;
        throw error;
      });

    this.listAllCache = {
      expiresAt: 0,
      records: [],
      promise,
    };

    return promise;
  }

  async listByPrimaryType(primaryTypeId: string): Promise<InstitutionDocumentRecord[]> {
    const typeId = primaryTypeId.trim();
    if (!typeId) {
      return [];
    }

    const now = Date.now();
    const cached = this.typeListCache.get(typeId);

    if (cached && cached.expiresAt > now) {
      return cached.records;
    }

    if (cached?.promise) {
      return cached.promise;
    }

    countFirestoreRead();
    const promise = this.fetchByPrimaryType(typeId)
      .then((records) => {
        this.typeListCache.set(typeId, {
          expiresAt: Date.now() + LIST_ALL_CACHE_TTL_MS,
          records,
        });
        return records;
      })
      .catch((error) => {
        this.typeListCache.delete(typeId);
        throw error;
      });

    this.typeListCache.set(typeId, {
      expiresAt: 0,
      records: [],
      promise,
    });

    return promise;
  }

  async listByCityId(cityId: string): Promise<InstitutionDocumentRecord[]> {
    const normalized = cityId.trim();
    if (!normalized) {
      return [];
    }

    const now = Date.now();
    const cached = this.cityListCache.get(normalized);

    if (cached && cached.expiresAt > now) {
      return cached.records;
    }

    if (cached?.promise) {
      return cached.promise;
    }

    countFirestoreRead();
    const promise = this.collection()
      .where("cityId", "==", normalized)
      .get()
      .then((snapshot) => {
        const records: InstitutionDocumentRecord[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          data: FirestoreInstitutionMapper.parseDocument(doc.data()),
        }));

        this.cityListCache.set(normalized, {
          expiresAt: Date.now() + LIST_ALL_CACHE_TTL_MS,
          records,
        });
        return records;
      })
      .catch((error) => {
        this.cityListCache.delete(normalized);
        throw error;
      });

    this.cityListCache.set(normalized, {
      expiresAt: 0,
      records: [],
      promise,
    });

    return promise;
  }

  async listByDistrictId(districtId: string): Promise<InstitutionDocumentRecord[]> {
    const normalized = districtId.trim();
    if (!normalized) {
      return [];
    }

    const now = Date.now();
    const cached = this.districtListCache.get(normalized);

    if (cached && cached.expiresAt > now) {
      return cached.records;
    }

    if (cached?.promise) {
      return cached.promise;
    }

    countFirestoreRead();
    const promise = this.collection()
      .where("districtId", "==", normalized)
      .get()
      .then((snapshot) => {
        const records: InstitutionDocumentRecord[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          data: FirestoreInstitutionMapper.parseDocument(doc.data()),
        }));

        this.districtListCache.set(normalized, {
          expiresAt: Date.now() + LIST_ALL_CACHE_TTL_MS,
          records,
        });
        return records;
      })
      .catch((error) => {
        this.districtListCache.delete(normalized);
        throw error;
      });

    this.districtListCache.set(normalized, {
      expiresAt: 0,
      records: [],
      promise,
    });

    return promise;
  }

  async create(id: string, data: FirestoreInstitutionDocument): Promise<void> {
    countFirestoreWrite();
    const ref = this.collection().doc(id);
    try {
      await ref.create(data);
      this.invalidateListAllCache();
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        throw new Error(`INSTITUTION_DOC_EXISTS:${id}`);
      }
      throw error;
    }
  }

  async createMany(
    entries: readonly { id: string; data: FirestoreInstitutionDocument }[],
  ): Promise<void> {
    countFirestoreWrite();
    if (entries.length === 0) {
      return;
    }
    // Firestore batch limit is 500.
    const batch = this.db.batch();
    for (const entry of entries) {
      batch.create(this.collection().doc(entry.id), entry.data);
    }
    try {
      await batch.commit();
      this.invalidateListAllCache();
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        throw new Error(`INSTITUTION_DOC_EXISTS:batch`);
      }
      throw error;
    }
  }

  async replace(id: string, data: FirestoreInstitutionDocument): Promise<void> {
    countFirestoreWrite();
    await this.collection().doc(id).set(data, { merge: false });
    this.invalidateListAllCache();
  }

  async delete(id: string): Promise<void> {
    countFirestoreWrite();
    await this.collection().doc(id).delete();
    this.invalidateListAllCache();
  }

  async exists(id: string): Promise<boolean> {
    countFirestoreRead();
    const snapshot = await this.collection().doc(id).get();
    return snapshot.exists;
  }

  private async fetchAllRecords(): Promise<InstitutionDocumentRecord[]> {
    const snapshot = await this.collection().get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));
  }

  private async fetchByPrimaryType(primaryTypeId: string): Promise<InstitutionDocumentRecord[]> {
    const snapshot = await this.collection().where("primaryTypeId", "==", primaryTypeId).get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));
  }

  private invalidateListAllCache(): void {
    this.listAllCache = undefined;
    this.typeListCache.clear();
    this.cityListCache.clear();
    this.districtListCache.clear();
  }

  private collection() {
    return this.db.collection(this.collectionPath);
  }
}

function isAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? Number((error as { code?: unknown }).code) : NaN;
  const message = error instanceof Error ? error.message : String(error);
  return code === 6 || /ALREADY_EXISTS|already exists/i.test(message);
}
