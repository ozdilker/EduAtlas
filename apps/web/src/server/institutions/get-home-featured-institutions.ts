import {
  getHomeFeaturedInstitutions,
  HOME_FEATURED_LIMIT,
} from "@eduatlas/application";
import type { InstitutionCardViewData } from "@eduatlas/ui";
import { getInstitutionRepository, getInstitutionSearchRepository } from "./repository";
import { toInstitutionCardFromSearchDocument } from "./to-search-card";

export type HomeFeaturedInstitutionsView = Readonly<{
  readonly cityId: string | null;
  readonly institutions: readonly InstitutionCardViewData[];
}>;

/**
 * Homepage Keşfet featured institutions ranked by profile completeness.
 */
export async function getHomeFeaturedInstitutionsView(options: {
  cityId?: string | null;
  limit?: number;
}): Promise<HomeFeaturedInstitutionsView> {
  const cityId = options.cityId?.trim() || null;
  const [institutionRepository, institutionSearchRepository] = await Promise.all([
    getInstitutionRepository(),
    getInstitutionSearchRepository(),
  ]);
  const ranked = await getHomeFeaturedInstitutions(
    {
      ...(cityId ? { cityId } : {}),
      limit: options.limit ?? HOME_FEATURED_LIMIT,
    },
    {
      institutionSearchRepository,
      institutionRepository,
    },
  );

  return Object.freeze({
    cityId,
    institutions: Object.freeze(
      ranked.map((item) => toInstitutionCardFromSearchDocument(item.document)),
    ),
  });
}
