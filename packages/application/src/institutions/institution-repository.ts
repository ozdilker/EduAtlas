import type { Institution, InstitutionId } from "@eduatlas/domain";
import type {
  InstitutionAdminListFilters,
  InstitutionAdminListPage,
  InstitutionAdminListPageInput,
} from "./institution-admin-list";
import type { InstitutionFilters } from "./institution-filters";
import type { InstitutionPage } from "./institution-page";
import type { InstitutionSort } from "./institution-sort";

/**
 * Options for InstitutionRepository.list().
 *
 * WARNING: The Firestore adapter historically materializes a scoped/full catalog
 * then slices in memory. Prefer {@link InstitutionRepository.listAdminPage} /
 * {@link InstitutionRepository.countAdmin} for admin UI pagination.
 * Keep list() for full-catalog business ops (import duplicate index, acquisition stats).
 */
export type InstitutionListOptions = Readonly<{
  readonly filters?: InstitutionFilters;
  readonly sort?: InstitutionSort;
  readonly page?: number;
  readonly pageSize?: number;
}>;

/**
 * Cursor page for public published-institution browse (no full-catalog download).
 */
export type InstitutionPublishedBrowsePage = Readonly<{
  readonly items: readonly Institution[];
  readonly pageSize: number;
  readonly nextCursor: string | null;
  readonly totalPublished: number;
}>;

export type {
  InstitutionAdminListFilters,
  InstitutionAdminListPage,
  InstitutionAdminListPageInput,
  InstitutionAdminListSort,
} from "./institution-admin-list";

/**
 * Persistence port for Institution aggregates.
 * Infrastructure adapters implement this — no Firebase in this package.
 */
export interface InstitutionRepository {
  /**
   * Loads an institution by id, or `null` when missing.
   */
  getById(id: InstitutionId): Promise<Institution | null>;

  /**
   * Loads an institution by public slug, or `null` when missing.
   */
  getBySlug(slug: string): Promise<Institution | null>;

  /**
   * Lists institutions with optional filters, sort, and pagination.
   */
  list(options?: InstitutionListOptions): Promise<InstitutionPage<Institution>>;

  /**
   * Optional: published institutions in a city with a hard read limit (Firestore `.limit`).
   * Used by public profile related cards — adapters must not download the entire city.
   */
  listRelatedPublishedByCity?(cityId: string, limit: number): Promise<readonly Institution[]>;

  /**
   * Optional: public /institutions browse with Firestore-level limit + cursor.
   * Must not call listAll / download the full catalog.
   */
  listPublishedBrowsePage?(input: {
    pageSize: number;
    cursor?: string | null;
  }): Promise<InstitutionPublishedBrowsePage>;

  /**
   * Optional: admin UI listing with Firestore limit + startAfter cursor.
   * Must not call listAll / unbounded collection gets.
   * Free-text query is not supported — callers must use list() or a search path.
   */
  listAdminPage?(input: InstitutionAdminListPageInput): Promise<InstitutionAdminListPage>;

  /**
   * Optional: Firestore aggregation count for admin filters (no document download).
   */
  countAdmin?(filters?: InstitutionAdminListFilters): Promise<number>;

  /**
   * Optional: sum of stored qualityScore + count (for average KPIs without document download).
   */
  sumAdminQualityScore?(
    filters?: InstitutionAdminListFilters,
  ): Promise<{ count: number; sum: number }>;

  /**
   * Persists a new institution.
   * @throws {DuplicateInstitutionError} when id or slug already exists
   */
  save(institution: Institution): Promise<Institution>;

  /**
   * Bulk persist for import pipelines (optional — adapters may omit).
   */
  saveMany?(institutions: readonly Institution[]): Promise<readonly Institution[]>;

  /**
   * Replaces an existing institution.
   * @throws {InstitutionNotFoundError} when the institution is missing
   * @throws {DuplicateInstitutionError} when the slug conflicts with another institution
   */
  update(institution: Institution): Promise<Institution>;

  /**
   * Deletes (or soft-deletes, per adapter policy) an institution by id.
   * @throws {InstitutionNotFoundError} when the institution is missing
   */
  delete(id: InstitutionId): Promise<void>;
}
