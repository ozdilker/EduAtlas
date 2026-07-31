import {
  createInstitutionId,
  institutionIdAsString,
  type OwnerRecommendation,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { LeadRepository } from "../leads/lead-repository";
import { evaluateOwnerRecommendationRules } from "./recommendation-rules";

export type GetOwnerRecommendationsInput = {
  institutionId: string;
  now?: string;
};

export type GetOwnerRecommendationsDependencies = {
  institutionRepository: InstitutionRepository;
  leadRepository: LeadRepository;
};

export type GetOwnerRecommendationsResult = Readonly<{
  readonly institutionId: string;
  readonly recommendations: readonly OwnerRecommendation[];
  readonly count: number;
}>;

/**
 * Application service: rule-based Sales Agent recommendations for an institution owner.
 * No LLM, emails, notifications, or automatic actions.
 */
export async function getOwnerRecommendations(
  input: GetOwnerRecommendationsInput,
  deps: GetOwnerRecommendationsDependencies,
): Promise<GetOwnerRecommendationsResult | null> {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    return null;
  }

  const institution = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    return null;
  }

  const leads = await deps.leadRepository.listByInstitutionId(institutionId);
  const recommendations = evaluateOwnerRecommendationRules({
    institution,
    leads,
    leadCounters: institution.leadCounters,
    now: input.now,
  });

  return Object.freeze({
    institutionId: institutionIdAsString(institution.id),
    recommendations,
    count: recommendations.length,
  });
}
