import type { InstitutionRepository } from "@eduatlas/application";
import { type Institution, institutionIdAsString } from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import type { InstitutionProfileViewData } from "@eduatlas/ui";
import { cache } from "react";
import { getInstitutionRepository } from "./repository";
import {
  isPublicInstitution,
  toInstitutionCardView,
  toInstitutionProfileView,
} from "./to-profile-view";

/** UI shows at most 3 related cards. */
const RELATED_UI_LIMIT = 3;
/**
 * Firestore hard cap: one extra doc so excluding the current institution still
 * leaves enough candidates without scanning the city.
 */
const RELATED_FIRESTORE_LIMIT = 7;

export type PublicInstitutionProfile = {
  readonly institution: Institution;
  readonly profile: InstitutionProfileViewData;
};

/**
 * Loads a published institution profile by slug through InstitutionRepository.
 * Returns null when missing or not publicly visible (caller should 404).
 */
export async function getPublicInstitutionProfileBySlug(
  slug: string,
  repository?: InstitutionRepository,
): Promise<PublicInstitutionProfile | null> {
  const repo = repository ?? (await getInstitutionRepository());
  const aboveFold = await getPublicInstitutionProfileAboveFoldBySlug(slug, repo);
  if (!aboveFold) {
    return null;
  }

  const related = await loadRelatedInstitutions(repo, aboveFold.institution);
  const geo = resolveGeoLabels(
    aboveFold.institution.location.cityId,
    aboveFold.institution.location.districtId,
  );

  return {
    institution: aboveFold.institution,
    profile: toInstitutionProfileView(aboveFold.institution, geo, related),
  };
}

export const getPublicInstitutionProfileAboveFoldBySlug = cache(
  async function getPublicInstitutionProfileAboveFoldBySlug(
    slug: string,
    repository?: InstitutionRepository,
  ): Promise<PublicInstitutionProfile | null> {
  const repo = repository ?? (await getInstitutionRepository());
  const institution = await repo.getBySlug(slug);

  if (!institution || !isPublicInstitution(institution)) {
    return null;
  }

  const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
  return {
    institution,
    profile: toInstitutionProfileView(institution, geo),
  };
},
);

export async function loadRelatedInstitutions(
  repository: InstitutionRepository,
  institution: Institution,
) {
  const currentId = institutionIdAsString(institution.id);
  const cityId = institution.location.cityId;

  if (!repository.listRelatedPublishedByCity) {
    throw new Error(
      "InstitutionRepository.listRelatedPublishedByCity is required for related institution queries.",
    );
  }

  const candidates = await repository.listRelatedPublishedByCity(
    cityId,
    RELATED_FIRESTORE_LIMIT,
  );

  return candidates
    .filter((item) => institutionIdAsString(item.id) !== currentId)
    .slice(0, RELATED_UI_LIMIT)
    .map((item) =>
      toInstitutionCardView(item, resolveGeoLabels(item.location.cityId, item.location.districtId)),
    );
}
