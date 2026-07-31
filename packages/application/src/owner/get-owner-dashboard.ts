import {
  createInstitutionId,
  evaluateInstitutionProfileCompleteness,
  type Lead,
  LeadStatus,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { LeadRepository } from "../leads/lead-repository";
import {
  buildOwnerLeadSummary,
  buildOwnerLeadSummaryFromCounters,
  createOwnerLeadTrendPlaceholder,
  createOwnerProfileCompletenessPanel,
  createOwnerRecommendationsPanel,
  type OwnerDashboard,
  selectLeadsByStatus,
  selectRecentLeads,
} from "./owner-dashboard-model";
import { evaluateOwnerRecommendationRules } from "./recommendation-rules";

export type GetOwnerDashboardInput = {
  institutionId: string;
  recentLimit?: number;
  pendingLimit?: number;
  now?: string;
};

export type GetOwnerDashboardDependencies = {
  institutionRepository: InstitutionRepository;
  leadRepository: LeadRepository;
};

const DEFAULT_RECENT_LIMIT = 8;
const DEFAULT_PENDING_LIMIT = 5;

/**
 * Application service: build the Institution Owner Dashboard from repositories only.
 * No Firestore, CRM, notifications, or billing.
 */
export async function getOwnerDashboard(
  input: GetOwnerDashboardInput,
  deps: GetOwnerDashboardDependencies,
): Promise<OwnerDashboard | null> {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    return null;
  }

  const institution = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    return null;
  }

  const leads: readonly Lead[] = await deps.leadRepository.listByInstitutionId(institutionId);
  const recentLimit = input.recentLimit ?? DEFAULT_RECENT_LIMIT;
  const pendingLimit = input.pendingLimit ?? DEFAULT_PENDING_LIMIT;
  const leadSummary = institution.leadCounters
    ? buildOwnerLeadSummaryFromCounters(institution.leadCounters)
    : buildOwnerLeadSummary({ leads });
  const recommendations = evaluateOwnerRecommendationRules({
    institution,
    leads,
    leadCounters: institution.leadCounters,
    now: input.now,
  });
  const completeness = evaluateInstitutionProfileCompleteness(institution);

  return Object.freeze({
    institutionSummary: Object.freeze({ institution }),
    leadSummary,
    pendingLeads: selectLeadsByStatus(leads, LeadStatus.New, pendingLimit),
    recentLeads: selectRecentLeads(leads, recentLimit),
    leadTrend: createOwnerLeadTrendPlaceholder(),
    recommendations: createOwnerRecommendationsPanel(recommendations),
    profileCompleteness: createOwnerProfileCompletenessPanel(completeness),
  });
}
