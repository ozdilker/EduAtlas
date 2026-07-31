import {
  createInstitutionId,
  evaluateInstitutionProfileCompleteness,
  type InstitutionSearchDocument,
} from "@eduatlas/domain";
import { createInstitutionFilters } from "./institution-filters";
import type { InstitutionRepository } from "./institution-repository";
import { createInstitutionSearchQuery } from "./institution-search-query";
import type { InstitutionSearchRepository } from "./institution-search-repository";

export const HOME_FEATURED_LIMIT = 6;
export const HOME_FEATURED_CANDIDATE_PAGE_SIZE = 48;

export type GetHomeFeaturedInstitutionsInput = {
  cityId?: string;
  limit?: number;
  candidatePageSize?: number;
};

export type GetHomeFeaturedInstitutionsDependencies = {
  institutionSearchRepository: InstitutionSearchRepository;
  institutionRepository: InstitutionRepository;
};

export type HomeFeaturedInstitution = Readonly<{
  readonly document: InstitutionSearchDocument;
  readonly completenessPercentage: number;
}>;

/**
 * Homepage Keşfet strip: optional city filter, rank by profile completeness desc, take top N.
 */
export async function getHomeFeaturedInstitutions(
  input: GetHomeFeaturedInstitutionsInput,
  deps: GetHomeFeaturedInstitutionsDependencies,
): Promise<readonly HomeFeaturedInstitution[]> {
  const limit = Math.max(1, Math.min(input.limit ?? HOME_FEATURED_LIMIT, 24));
  const candidatePageSize = Math.max(
    limit,
    Math.min(input.candidatePageSize ?? HOME_FEATURED_CANDIDATE_PAGE_SIZE, 100),
  );
  const cityId = input.cityId?.trim();

  const searchResult = await deps.institutionSearchRepository.search(
    createInstitutionSearchQuery({
      page: 1,
      pageSize: candidatePageSize,
      filters: createInstitutionFilters(cityId ? { cityId } : {}),
    }),
  );

  const ranked = await Promise.all(
    searchResult.page.items.map(async (document) => {
      const institution = await deps.institutionRepository.getById(
        createInstitutionId(document.id),
      );
      const completenessPercentage = institution
        ? evaluateInstitutionProfileCompleteness(institution).overallPercentage
        : 0;
      return Object.freeze({ document, completenessPercentage });
    }),
  );

  ranked.sort((left, right) => {
    const byCompleteness = right.completenessPercentage - left.completenessPercentage;
    if (byCompleteness !== 0) {
      return byCompleteness;
    }
    return left.document.name.localeCompare(right.document.name, "tr");
  });

  return Object.freeze(ranked.slice(0, limit));
}
