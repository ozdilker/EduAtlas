import {
  createInstitutionId,
  evaluateInstitutionProfileCompleteness,
  institutionIdAsString,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { LeadRepository } from "../leads/lead-repository";
import {
  buildLeadConversionFunnel,
  buildLeadStatusDistribution,
  countLeadsInWindow,
  createAverageResponseTimePlaceholder,
  createGrowthTrendPlaceholder,
  createTopLeadSourcePlaceholder,
  generateOwnerBusinessInsights,
  type OwnerInsights,
} from "./owner-insights-model";
import { evaluateOwnerRecommendationRules } from "./recommendation-rules";

export type GetOwnerInsightsInput = {
  institutionId: string;
  now?: string;
  windowDays?: number;
};

export type GetOwnerInsightsDependencies = {
  institutionRepository: InstitutionRepository;
  leadRepository: LeadRepository;
};

const DEFAULT_WINDOW_DAYS = 30;

/**
 * Application service: Owner Insights dashboard — student acquisition metrics.
 * Reuses repositories, completeness engine, and recommendation rules.
 * No LLM, CRM, notifications, or chart libraries.
 */
export async function getOwnerInsights(
  input: GetOwnerInsightsInput,
  deps: GetOwnerInsightsDependencies,
): Promise<OwnerInsights | null> {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    return null;
  }

  const institution = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    return null;
  }

  const leads = await deps.leadRepository.listByInstitutionId(institutionId);
  const now = input.now ?? new Date().toISOString();
  const windowDays = input.windowDays ?? DEFAULT_WINDOW_DAYS;

  const newLeadsLast30Days = countLeadsInWindow(leads, now, windowDays, 0);
  const previousPeriodLeads = countLeadsInWindow(leads, now, windowDays, windowDays);
  const profileCompleteness = evaluateInstitutionProfileCompleteness(institution);
  const recommendations = evaluateOwnerRecommendationRules({
    institution,
    leads,
    now,
  });

  const businessInsights = generateOwnerBusinessInsights({
    institution,
    leads,
    totalLeads: leads.length,
    newLeadsLast30Days,
    previousPeriodLeads,
    profileCompleteness,
  });

  return Object.freeze({
    institutionId: institutionIdAsString(institution.id),
    institutionName: institution.name,
    institutionLogoUrl: institution.logoUrl,
    totalLeads: leads.length,
    newLeadsLast30Days,
    previousPeriodLeads,
    statusDistribution: buildLeadStatusDistribution(leads),
    conversionFunnel: buildLeadConversionFunnel(leads),
    profileCompleteness,
    averageResponseTime: createAverageResponseTimePlaceholder(),
    topLeadSource: createTopLeadSourcePlaceholder(),
    growthTrend: createGrowthTrendPlaceholder(),
    businessInsights,
    recommendations,
  });
}
