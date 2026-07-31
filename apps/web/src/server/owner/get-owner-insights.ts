import type { InstitutionRepository, LeadRepository } from "@eduatlas/application";
import { getOwnerInsights } from "@eduatlas/application";
import type { OwnerInsightsViewData } from "@eduatlas/ui";
import { getInstitutionRepository } from "../institutions/repository";
import { getLeadRepository } from "./lead-repository";
import { getOwnerDemoInstitutionId } from "./owner-demo-context";

export type GetOwnerInsightsViewOptions = {
  institutionId?: string;
  institutionRepository?: InstitutionRepository;
  leadRepository?: LeadRepository;
  now?: string;
};

/**
 * Loads Owner Insights view data via application service + repositories.
 */
export async function getOwnerInsightsView(
  options: GetOwnerInsightsViewOptions = {},
): Promise<OwnerInsightsViewData | null> {
  const institutionId = options.institutionId ?? getOwnerDemoInstitutionId();
  const [institutionRepository, leadRepository] = await Promise.all([
    options.institutionRepository
      ? Promise.resolve(options.institutionRepository)
      : getInstitutionRepository(),
    options.leadRepository ? Promise.resolve(options.leadRepository) : getLeadRepository(),
  ]);

  const insights = await getOwnerInsights(
    { institutionId, now: options.now },
    { institutionRepository, leadRepository },
  );

  if (!insights) {
    return null;
  }

  return {
    institutionId: insights.institutionId,
    institutionName: insights.institutionName,
    institutionLogoUrl: insights.institutionLogoUrl,
    totalLeads: insights.totalLeads,
    newLeadsLast30Days: insights.newLeadsLast30Days,
    previousPeriodLeads: insights.previousPeriodLeads,
    statusDistribution: insights.statusDistribution.map((item) => ({
      status: item.status,
      label: item.label,
      count: item.count,
      percentage: item.percentage,
    })),
    conversionFunnel: insights.conversionFunnel.map((item) => ({
      status: item.status,
      label: item.label,
      count: item.count,
      percentage: item.percentage,
    })),
    profileCompleteness: {
      overallPercentage: insights.profileCompleteness.overallPercentage,
      nextActionHint: insights.profileCompleteness.nextActionHint,
      completedCount: insights.profileCompleteness.completedSections.length,
      missingCount: insights.profileCompleteness.missingSections.length,
      missingSectionLabels: insights.profileCompleteness.missingSections.map(
        (section) => section.label,
      ),
      profileHref: "/owner/profile",
    },
    averageResponseTime: {
      id: insights.averageResponseTime.id,
      label: insights.averageResponseTime.label,
      value: insights.averageResponseTime.value,
      description: insights.averageResponseTime.description,
      kind: insights.averageResponseTime.kind,
    },
    topLeadSource: {
      id: insights.topLeadSource.id,
      label: insights.topLeadSource.label,
      value: insights.topLeadSource.value,
      description: insights.topLeadSource.description,
      kind: insights.topLeadSource.kind,
    },
    growthTrend: {
      id: insights.growthTrend.id,
      label: insights.growthTrend.label,
      value: insights.growthTrend.value,
      description: insights.growthTrend.description,
      kind: insights.growthTrend.kind,
    },
    businessInsights: insights.businessInsights.map((item) => ({
      id: item.id,
      message: item.message,
    })),
    recommendations: insights.recommendations.map((item) => ({
      id: item.id,
      type: item.type,
      priority: item.priority,
      priorityLabel: recommendationPriorityLabel(item.priority),
      ruleId: item.ruleId,
      title: item.title,
      message: item.message,
    })),
  };
}

function recommendationPriorityLabel(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "Yüksek";
    case "medium":
      return "Orta";
    default:
      return "Düşük";
  }
}
