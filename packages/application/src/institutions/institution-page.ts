/**
 * Immutable paginated page of items.
 */
export type InstitutionPage<T> = Readonly<{
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}>;

export type CreateInstitutionPageInput<T> = {
  items: readonly T[];
  page: number;
  pageSize: number;
  totalItems: number;
};

/**
 * Creates an immutable InstitutionPage.
 */
export function createInstitutionPage<T>(input: CreateInstitutionPageInput<T>): InstitutionPage<T> {
  const page = input.page;
  const pageSize = input.pageSize;
  const totalItems = input.totalItems;

  if (!Number.isInteger(page) || page < 1) {
    throw new Error("InstitutionPage.page must be an integer >= 1.");
  }

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error("InstitutionPage.pageSize must be an integer >= 1.");
  }

  if (!Number.isInteger(totalItems) || totalItems < 0) {
    throw new Error("InstitutionPage.totalItems must be an integer >= 0.");
  }

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

  return Object.freeze({
    items: Object.freeze([...input.items]),
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}

/**
 * Default public page size (SEARCH-ARCHITECTURE guidance).
 */
export const DEFAULT_INSTITUTION_PAGE_SIZE = 12;
