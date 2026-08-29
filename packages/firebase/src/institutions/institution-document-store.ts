import type { FirestoreInstitutionDocument } from "./firestore-institution-document";

export type InstitutionDocumentRecord = {
  id: string;
  data: FirestoreInstitutionDocument;
};

/** Structured filters applied in Firestore before limit (empty-text search / browse). */
export type PublishedBrowseFilters = Readonly<{
  readonly cityId?: string;
  readonly districtId?: string;
  readonly primaryTypeId?: string;
}>;

/** Admin list equality/range filters applied in Firestore before limit/count. */
export type AdminListFilters = Readonly<{
  readonly lifecycleStatus?: string;
  readonly cityId?: string;
  readonly districtId?: string;
  readonly primaryTypeId?: string;
  readonly claimStatus?: string;
  /** Firestore `in` filter (max 10). Ignored when claimStatus is set. */
  readonly claimStatusIn?: readonly string[];
  readonly isPremium?: boolean;
  readonly qualityScoreMin?: number;
  readonly qualityScoreMaxExclusive?: number;
}>;

export type AdminListSort =
  | "name_asc"
  | "name_desc"
  | "created_desc"
  | "quality_desc"
  | "quality_asc";

export type AdminListCursor = Readonly<{
  readonly sort: AdminListSort;
  readonly name?: string;
  readonly createdAt?: string;
  readonly qualityScore?: number;
  readonly id: string;
}>;

/**
 * Persistence gateway used by FirestoreInstitutionRepository.
 * Real Firestore and in-memory fakes both implement this — keeps mapping in one place.
 */
export interface InstitutionDocumentStore {
  getById(id: string): Promise<InstitutionDocumentRecord | null>;
  findBySlug(slug: string): Promise<InstitutionDocumentRecord | null>;
  listAll(): Promise<InstitutionDocumentRecord[]>;
  /**
   * Optional type-scoped listing — avoids downloading the full catalog for category hubs.
   */
  listByPrimaryType?(primaryTypeId: string): Promise<InstitutionDocumentRecord[]>;
  /**
   * Optional geography-scoped listing — avoids downloading the full catalog for city landing pages.
   */
  listByCityId?(cityId: string): Promise<InstitutionDocumentRecord[]>;
  /**
   * Optional geography-scoped listing — avoids downloading the full catalog for district landing pages.
   */
  listByDistrictId?(districtId: string): Promise<InstitutionDocumentRecord[]>;
  /**
   * Published institutions in a city, limited in Firestore (or equivalent) before materialization.
   * Used by public profile "related" cards — must not download the entire city.
   */
  listPublishedByCityIdLimited?(
    cityId: string,
    limit: number,
  ): Promise<InstitutionDocumentRecord[]>;
  /**
   * Public published browse/search — ordered + hard-capped (no listAll).
   * Optional structured filters are applied in Firestore before limit.
   */
  listPublishedBrowsePage?(input: {
    limit: number;
    cursor?: { qualityScore: number; id: string } | null;
    filters?: PublishedBrowseFilters;
  }): Promise<{
    records: InstitutionDocumentRecord[];
    nextCursor: { qualityScore: number; id: string } | null;
  }>;
  /**
   * Aggregation count of published institutions (optional structured filters).
   */
  countPublished?(filters?: PublishedBrowseFilters): Promise<number>;
  /**
   * Free-text candidate load: published + structured filters in Firestore, no page limit.
   * Used when q is non-empty and at least one of cityId/districtId/primaryTypeId is set.
   * Must not call listAll / full-collection get.
   */
  listPublishedCandidates?(filters: PublishedBrowseFilters): Promise<InstitutionDocumentRecord[]>;
  /**
   * Admin UI page — equality filters + orderBy + hard limit + startAfter (no listAll).
   */
  listAdminPage?(input: {
    limit: number;
    sort: AdminListSort;
    cursor?: AdminListCursor | null;
    filters?: AdminListFilters;
  }): Promise<{
    records: InstitutionDocumentRecord[];
    nextCursor: AdminListCursor | null;
  }>;
  /**
   * Admin filtered count via aggregation (no document download).
   */
  countAdmin?(filters?: AdminListFilters): Promise<number>;
  /**
   * Sum of stored qualityScore + count for average KPIs (no document download).
   */
  sumAdminQualityScore?(filters?: AdminListFilters): Promise<{ count: number; sum: number }>;
  /**
   * Equality lookup on contactEmail (normalized lowercase) + hard limit.
   * Single-field equality — no catalog download.
   */
  findByContactEmail?(
    email: string,
    limit: number,
  ): Promise<InstitutionDocumentRecord[]>;
  /**
   * Equality lookup on name (+ optional cityId/districtId) + hard limit.
   */
  findByExactName?(input: {
    name: string;
    cityId?: string;
    districtId?: string;
    limit: number;
  }): Promise<InstitutionDocumentRecord[]>;
  create(id: string, data: FirestoreInstitutionDocument): Promise<void>;
  /**
   * Creates many docs in as few round-trips as possible (Firestore WriteBatch).
   * Implementations may fall back to sequential create.
   */
  createMany?(
    entries: readonly { id: string; data: FirestoreInstitutionDocument }[],
  ): Promise<void>;
  replace(id: string, data: FirestoreInstitutionDocument): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
