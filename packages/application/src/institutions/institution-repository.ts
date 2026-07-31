import type { Institution, InstitutionId } from "@eduatlas/domain";
import type { InstitutionFilters } from "./institution-filters";
import type { InstitutionPage } from "./institution-page";
import type { InstitutionSort } from "./institution-sort";

/**
 * Options for InstitutionRepository.list().
 */
export type InstitutionListOptions = Readonly<{
  readonly filters?: InstitutionFilters;
  readonly sort?: InstitutionSort;
  readonly page?: number;
  readonly pageSize?: number;
}>;

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
