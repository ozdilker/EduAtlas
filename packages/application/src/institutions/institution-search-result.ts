import type { InstitutionSearchDocument } from "@eduatlas/domain";
import { createInstitutionPage, type InstitutionPage } from "./institution-page";
import type { InstitutionSearchQuery } from "./institution-search-query";

/**
 * Search response contract for InstitutionSearchRepository.search().
 */
export type InstitutionSearchResult = Readonly<{
  readonly query: InstitutionSearchQuery;
  readonly page: InstitutionPage<InstitutionSearchDocument>;
}>;

export type CreateInstitutionSearchResultInput = {
  query: InstitutionSearchQuery;
  items: readonly InstitutionSearchDocument[];
  totalItems: number;
};

/**
 * Creates an immutable InstitutionSearchResult.
 */
export function createInstitutionSearchResult(
  input: CreateInstitutionSearchResultInput,
): InstitutionSearchResult {
  return Object.freeze({
    query: input.query,
    page: createInstitutionPage({
      items: input.items,
      page: input.query.page,
      pageSize: input.query.pageSize,
      totalItems: input.totalItems,
    }),
  });
}
