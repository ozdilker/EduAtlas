import { AggregateField, FieldPath, type Firestore, type Query } from "firebase-admin/firestore";
import { foldTurkishText } from "@eduatlas/domain";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";
import {
  type FirestoreInstitutionDocument,
  INSTITUTIONS_COLLECTION,
} from "./firestore-institution-document";
import { FirestoreInstitutionMapper } from "./firestore-institution-mapper";
import type {
  AdminListCursor,
  AdminListFilters,
  AdminListSort,
  InstitutionDocumentRecord,
  InstitutionDocumentStore,
  PublishedBrowseFilters,
} from "./institution-document-store";

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

  /**
   * Public browse/search: published + optional structured filters + qualityScore order + hard limit.
   */
  async listPublishedBrowsePage(input: {
    limit: number;
    cursor?: { qualityScore: number; id: string } | null;
    filters?: PublishedBrowseFilters;
  }): Promise<{
    records: InstitutionDocumentRecord[];
    nextCursor: { qualityScore: number; id: string } | null;
  }> {
    const capped = Math.max(0, Math.floor(input.limit));
    if (capped === 0) {
      return { records: [], nextCursor: null };
    }

    countFirestoreRead();
    let query = this.buildPublishedStructuredQuery(input.filters)
      .orderBy("qualityScore", "desc")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(capped);

    const cursor = input.cursor;
    if (cursor?.id) {
      query = query.startAfter(cursor.qualityScore, cursor.id.trim());
    }

    const snapshot = await query.get();
    const records: InstitutionDocumentRecord[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));

    const last = records[records.length - 1];
    const nextCursor =
      records.length === capped && last
        ? { qualityScore: last.data.qualityScore ?? 0, id: last.id }
        : null;

    return { records, nextCursor };
  }

  async countPublished(filters?: PublishedBrowseFilters): Promise<number> {
    countFirestoreRead();
    const snapshot = await this.buildPublishedStructuredQuery(filters).count().get();
    return snapshot.data().count;
  }

  /**
   * Scoped free-text candidates — equality filters only, no orderBy/limit.
   * Callers must pass at least one structured filter (city/district/type).
   */
  async listPublishedCandidates(
    filters: PublishedBrowseFilters,
  ): Promise<InstitutionDocumentRecord[]> {
    const cityId = filters.cityId?.trim();
    const districtId = filters.districtId?.trim();
    const primaryTypeId = filters.primaryTypeId?.trim();
    if (!cityId && !districtId && !primaryTypeId) {
      throw new Error(
        "listPublishedCandidates requires at least one of cityId, districtId, primaryTypeId.",
      );
    }

    countFirestoreRead();
    const snapshot = await this.buildPublishedStructuredQuery({
      ...(cityId ? { cityId } : {}),
      ...(districtId ? { districtId } : {}),
      ...(primaryTypeId ? { primaryTypeId } : {}),
    }).get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));
  }

  private buildPublishedStructuredQuery(filters?: PublishedBrowseFilters): Query {
    let query: Query = this.collection().where("lifecycleStatus", "==", "published");
    const cityId = filters?.cityId?.trim();
    const districtId = filters?.districtId?.trim();
    const primaryTypeId = filters?.primaryTypeId?.trim();
    if (cityId) {
      query = query.where("cityId", "==", cityId);
    }
    if (districtId) {
      query = query.where("districtId", "==", districtId);
    }
    if (primaryTypeId) {
      query = query.where("primaryTypeId", "==", primaryTypeId);
    }
    return query;
  }

  /**
   * Related-card query: city + published, ordered by qualityScore, hard-capped in Firestore.
   */
  async listPublishedByCityIdLimited(
    cityId: string,
    limit: number,
  ): Promise<InstitutionDocumentRecord[]> {
    const normalized = cityId.trim();
    const capped = Math.max(0, Math.floor(limit));
    if (!normalized || capped === 0) {
      return [];
    }

    countFirestoreRead();
    const snapshot = await this.collection()
      .where("cityId", "==", normalized)
      .where("lifecycleStatus", "==", "published")
      .orderBy("qualityScore", "desc")
      .limit(capped)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));
  }

  /**
   * Admin listing: equality filters + orderBy + hard limit + startAfter (never listAll).
   */
  async listAdminPage(input: {
    limit: number;
    sort: AdminListSort;
    cursor?: AdminListCursor | null;
    filters?: AdminListFilters;
  }): Promise<{
    records: InstitutionDocumentRecord[];
    nextCursor: AdminListCursor | null;
  }> {
    const capped = Math.max(0, Math.floor(input.limit));
    if (capped === 0) {
      return { records: [], nextCursor: null };
    }

    countFirestoreRead();
    let query = this.applyAdminSort(this.buildAdminFilteredQuery(input.filters), input.sort).limit(
      capped,
    );

    const cursor = input.cursor;
    if (cursor?.id && cursor.sort === input.sort) {
      query = applyAdminStartAfter(query, cursor);
    }

    const snapshot = await query.get();
    const records: InstitutionDocumentRecord[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));

    const last = records[records.length - 1];
    const nextCursor =
      records.length === capped && last ? toAdminListCursor(input.sort, last) : null;

    return { records, nextCursor };
  }

  async countAdmin(filters?: AdminListFilters): Promise<number> {
    countFirestoreRead();
    const snapshot = await this.buildAdminFilteredQuery(filters).count().get();
    return snapshot.data().count;
  }

  async sumAdminQualityScore(filters?: AdminListFilters): Promise<{ count: number; sum: number }> {
    countFirestoreRead();
    const snapshot = await this.buildAdminFilteredQuery(filters)
      .aggregate({
        count: AggregateField.count(),
        scoreSum: AggregateField.sum("qualityScore"),
      })
      .get();
    const count = Number(snapshot.data().count ?? 0);
    const sum = Number(snapshot.data().scoreSum ?? 0);
    return { count, sum };
  }

  async findByContactEmail(email: string, limit: number): Promise<InstitutionDocumentRecord[]> {
    const normalized = email.trim().toLowerCase();
    const capped = Math.max(0, Math.min(Math.floor(limit), 20));
    if (!normalized || !normalized.includes("@") || capped === 0) return [];
    countFirestoreRead();
    const snapshot = await this.collection()
      .where("contactEmail", "==", normalized)
      .limit(capped)
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));
  }

  async findByExactName(input: {
    name: string;
    cityId?: string;
    districtId?: string;
    limit: number;
  }): Promise<InstitutionDocumentRecord[]> {
    const nameFolded = foldTurkishText(input.name.trim());
    const capped = Math.max(0, Math.min(Math.floor(input.limit), 20));
    if (!nameFolded || capped === 0) return [];
    countFirestoreRead();
    let query: Query = this.collection().where("nameFolded", "==", nameFolded);
    const cityId = input.cityId?.trim();
    const districtId = input.districtId?.trim();
    if (cityId) query = query.where("cityId", "==", cityId);
    if (districtId) query = query.where("districtId", "==", districtId);
    const snapshot = await query.limit(capped).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));
  }

  async findBySearchKeyword(input: {
    keyword: string;
    cityId?: string;
    districtId?: string;
    limit: number;
  }): Promise<InstitutionDocumentRecord[]> {
    const keyword = foldTurkishText(input.keyword.trim());
    const capped = Math.max(0, Math.min(Math.floor(input.limit), 20));
    if (!keyword || capped === 0) return [];
    countFirestoreRead();
    let query: Query = this.collection().where("searchKeywords", "array-contains", keyword);
    const cityId = input.cityId?.trim();
    const districtId = input.districtId?.trim();
    if (cityId) query = query.where("cityId", "==", cityId);
    if (districtId) query = query.where("districtId", "==", districtId);
    const snapshot = await query.limit(capped).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      data: FirestoreInstitutionMapper.parseDocument(doc.data()),
    }));
  }

  private buildAdminFilteredQuery(filters?: AdminListFilters): Query {
    let query: Query = this.collection();
    const lifecycleStatus = filters?.lifecycleStatus?.trim();
    const cityId = filters?.cityId?.trim();
    const districtId = filters?.districtId?.trim();
    const primaryTypeId = filters?.primaryTypeId?.trim();
    const claimStatus = filters?.claimStatus?.trim();
    const claimStatusIn = filters?.claimStatusIn?.map((item) => item.trim()).filter(Boolean);

    if (lifecycleStatus) {
      query = query.where("lifecycleStatus", "==", lifecycleStatus);
    }
    if (cityId) {
      query = query.where("cityId", "==", cityId);
    }
    if (districtId) {
      query = query.where("districtId", "==", districtId);
    }
    if (primaryTypeId) {
      query = query.where("primaryTypeId", "==", primaryTypeId);
    }
    if (claimStatus) {
      query = query.where("claimStatus", "==", claimStatus);
    } else if (claimStatusIn && claimStatusIn.length > 0) {
      query = query.where("claimStatus", "in", claimStatusIn.slice(0, 10));
    }
    if (filters?.isPremium !== undefined) {
      query = query.where("isPremium", "==", filters.isPremium);
    }
    if (typeof filters?.qualityScoreMin === "number") {
      query = query.where("qualityScore", ">=", filters.qualityScoreMin);
    }
    if (typeof filters?.qualityScoreMaxExclusive === "number") {
      query = query.where("qualityScore", "<", filters.qualityScoreMaxExclusive);
    }
    return query;
  }

  private applyAdminSort(query: Query, sort: AdminListSort): Query {
    switch (sort) {
      case "name_desc":
        return query.orderBy("name", "desc").orderBy(FieldPath.documentId(), "asc");
      case "created_desc":
        return query.orderBy("createdAt", "desc").orderBy(FieldPath.documentId(), "asc");
      case "quality_desc":
        return query.orderBy("qualityScore", "desc").orderBy(FieldPath.documentId(), "asc");
      case "quality_asc":
        return query.orderBy("qualityScore", "asc").orderBy(FieldPath.documentId(), "asc");
      default:
        return query.orderBy("name", "asc").orderBy(FieldPath.documentId(), "asc");
    }
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

function toAdminListCursor(
  sort: AdminListSort,
  record: InstitutionDocumentRecord,
): AdminListCursor {
  const id = record.id;
  switch (sort) {
    case "name_desc":
    case "name_asc":
      return { sort, name: record.data.name, id };
    case "created_desc":
      return { sort, createdAt: record.data.createdAt, id };
    case "quality_desc":
    case "quality_asc":
      return { sort, qualityScore: record.data.qualityScore ?? 0, id };
    default:
      return { sort: "name_asc", name: record.data.name, id };
  }
}

function applyAdminStartAfter(query: Query, cursor: AdminListCursor): Query {
  const id = cursor.id.trim();
  switch (cursor.sort) {
    case "name_desc":
    case "name_asc":
      return query.startAfter(cursor.name ?? "", id);
    case "created_desc":
      return query.startAfter(cursor.createdAt ?? "", id);
    case "quality_desc":
    case "quality_asc":
      return query.startAfter(cursor.qualityScore ?? 0, id);
    default:
      return query.startAfter(cursor.name ?? "", id);
  }
}
