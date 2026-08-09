import {
  type CreateInstitutionFiltersInput,
  createInstitutionFilters,
  type InstitutionFilters,
} from "./institution-filters";
import { DEFAULT_INSTITUTION_PAGE_SIZE } from "./institution-page";
import { type InstitutionSort, parseInstitutionSort } from "./institution-sort";

/**
 * Search request contract for InstitutionSearchRepository.search().
 */
export type InstitutionSearchQuery = Readonly<{
  readonly text: string;
  readonly filters: InstitutionFilters;
  readonly sort: InstitutionSort;
  readonly page: number;
  readonly pageSize: number;
  /** Opaque Firestore startAfter cursor (empty-text / structured search only). */
  readonly cursor?: string;
}>;

export type CreateInstitutionSearchQueryInput = {
  text?: string;
  filters?: CreateInstitutionFiltersInput | InstitutionFilters;
  sort?: InstitutionSort | string;
  page?: number;
  pageSize?: number;
  cursor?: string | null;
};

/**
 * Creates an immutable InstitutionSearchQuery.
 */
export function createInstitutionSearchQuery(
  input: CreateInstitutionSearchQueryInput = {},
): InstitutionSearchQuery {
  const text = input.text?.trim() ?? "";
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? DEFAULT_INSTITUTION_PAGE_SIZE;
  const sort =
    typeof input.sort === "string" || input.sort === undefined
      ? parseInstitutionSort(input.sort)
      : input.sort;

  if (!Number.isInteger(page) || page < 1) {
    throw new Error("InstitutionSearchQuery.page must be an integer >= 1.");
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("InstitutionSearchQuery.pageSize must be an integer between 1 and 100.");
  }

  const filters = createInstitutionFilters(input.filters ?? {});
  const cursor = input.cursor?.trim() || undefined;

  return Object.freeze({
    text,
    filters,
    sort,
    page,
    pageSize,
    ...(cursor ? { cursor } : {}),
  });
}
