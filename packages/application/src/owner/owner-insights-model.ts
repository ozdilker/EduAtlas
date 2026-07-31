import type {
  Institution,
  InstitutionProfileCompleteness,
  Lead,
  OwnerRecommendation,
} from "@eduatlas/domain";
import { LEAD_PIPELINE_STATUSES, type LeadPipelineStatus, LeadStatus } from "@eduatlas/domain";

export type OwnerInsightsMetric = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly value: number | string;
  readonly description?: string;
  readonly kind: "metric" | "placeholder";
}>;

export type OwnerInsightsDistributionItem = Readonly<{
  readonly status: string;
  readonly label: string;
  readonly count: number;
  readonly percentage: number;
}>;

export type OwnerInsightsFunnelStep = Readonly<{
  readonly status: LeadPipelineStatus;
  readonly label: string;
  readonly count: number;
  readonly percentage: number;
}>;

export type OwnerBusinessInsight = Readonly<{
  readonly id: string;
  readonly message: string;
}>;

/**
 * Owner Insights dashboard aggregate — rule-based metrics + placeholders.
 * No CRM, notifications, chart libraries, or AI APIs.
 */
export type OwnerInsights = Readonly<{
  readonly institutionId: string;
  readonly institutionName: string;
  readonly institutionLogoUrl?: string;
  readonly totalLeads: number;
  readonly newLeadsLast30Days: number;
  readonly previousPeriodLeads: number;
  readonly statusDistribution: readonly OwnerInsightsDistributionItem[];
  readonly conversionFunnel: readonly OwnerInsightsFunnelStep[];
  readonly profileCompleteness: InstitutionProfileCompleteness;
  readonly averageResponseTime: OwnerInsightsMetric;
  readonly topLeadSource: OwnerInsightsMetric;
  readonly growthTrend: OwnerInsightsMetric;
  readonly businessInsights: readonly OwnerBusinessInsight[];
  readonly recommendations: readonly OwnerRecommendation[];
}>;

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Yeni",
  read: "Okundu",
  contacted: "İletişim",
  appointment: "Randevu",
  enrolled: "Kayıt",
  lost: "Kayıp",
  closed: "Kapatıldı",
  spam: "Spam",
};

const PIPELINE_LABELS: Record<LeadPipelineStatus, string> = {
  new: "Yeni",
  contacted: "İletişim",
  appointment: "Randevu",
  enrolled: "Kayıt",
  lost: "Kayıp",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Counts leads created within the last `days` ending at `now`.
 */
export function countLeadsInWindow(
  leads: readonly Lead[],
  nowIso: string,
  days: number,
  offsetDays = 0,
): number {
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(nowMs)) return 0;

  const windowEnd = nowMs - offsetDays * MS_PER_DAY;
  const windowStart = windowEnd - days * MS_PER_DAY;

  return leads.filter((lead) => {
    const createdMs = Date.parse(lead.createdAt);
    if (Number.isNaN(createdMs)) return false;
    return createdMs >= windowStart && createdMs < windowEnd;
  }).length;
}

/**
 * Builds lead status distribution with percentages (progress-bar friendly).
 */
export function buildLeadStatusDistribution(
  leads: readonly Lead[],
): readonly OwnerInsightsDistributionItem[] {
  const counts: Record<string, number> = {};
  for (const lead of leads) {
    counts[lead.status] = (counts[lead.status] ?? 0) + 1;
  }

  const total = leads.length || 1;
  const order: LeadStatus[] = [
    LeadStatus.New,
    LeadStatus.Read,
    LeadStatus.Contacted,
    LeadStatus.Appointment,
    LeadStatus.Enrolled,
    LeadStatus.Lost,
    LeadStatus.Closed,
    LeadStatus.Spam,
  ];

  return Object.freeze(
    order
      .map((status) => {
        const count = counts[status] ?? 0;
        return Object.freeze({
          status,
          label: STATUS_LABELS[status],
          count,
          percentage: Math.round((count / total) * 100),
        });
      })
      .filter((item) => item.count > 0),
  );
}

/**
 * Builds a lightweight conversion funnel across pipeline stages.
 */
export function buildLeadConversionFunnel(
  leads: readonly Lead[],
): readonly OwnerInsightsFunnelStep[] {
  const total = leads.length || 1;
  return Object.freeze(
    LEAD_PIPELINE_STATUSES.map((status) => {
      const count = leads.filter((lead) => lead.status === status).length;
      return Object.freeze({
        status,
        label: PIPELINE_LABELS[status],
        count,
        percentage: Math.round((count / total) * 100),
      });
    }),
  );
}

/**
 * Generates short rule-based business insights (no LLM).
 */
export function generateOwnerBusinessInsights(input: {
  institution: Institution;
  leads: readonly Lead[];
  totalLeads: number;
  newLeadsLast30Days: number;
  previousPeriodLeads: number;
  profileCompleteness: InstitutionProfileCompleteness;
}): readonly OwnerBusinessInsight[] {
  const insights: OwnerBusinessInsight[] = [];
  const {
    institution,
    leads,
    totalLeads,
    newLeadsLast30Days,
    previousPeriodLeads,
    profileCompleteness,
  } = input;
  void institution;

  insights.push(
    Object.freeze({
      id: "insight_total_leads",
      message: `EduAtlas üzerinden ${totalLeads} talep aldınız.`,
    }),
  );

  if (newLeadsLast30Days > previousPeriodLeads) {
    insights.push(
      Object.freeze({
        id: "insight_volume_up",
        message: "Talep hacmi bir önceki döneme göre arttı.",
      }),
    );
  } else if (newLeadsLast30Days < previousPeriodLeads) {
    insights.push(
      Object.freeze({
        id: "insight_volume_down",
        message: "Talep hacmi bir önceki döneme göre azaldı.",
      }),
    );
  } else if (totalLeads > 0) {
    insights.push(
      Object.freeze({
        id: "insight_volume_flat",
        message: "Talep hacmi bir önceki dönemle aynı seviyede.",
      }),
    );
  }

  const newCount = leads.filter((lead) => lead.status === LeadStatus.New).length;
  if (totalLeads > 0 && newCount / totalLeads >= 0.4) {
    insights.push(
      Object.freeze({
        id: "insight_new_backlog",
        message: "Taleplerinizin çoğu hâlâ ilk yanıtı bekliyor.",
      }),
    );
  }

  insights.push(
    Object.freeze({
      id: "insight_completeness",
      message: `Kurum profiliniz %${profileCompleteness.overallPercentage} tamamlanmış.`,
    }),
  );

  if (profileCompleteness.overallPercentage < 80) {
    insights.push(
      Object.freeze({
        id: "insight_completeness_tip",
        message: "Profilleri tamamlanmış kurumlar genellikle daha fazla etkileşim alır.",
      }),
    );
  }

  return Object.freeze(insights);
}

export function createAverageResponseTimePlaceholder(): OwnerInsightsMetric {
  return Object.freeze({
    id: "avg_response_time",
    label: "Ortalama yanıt süresi",
    value: "—",
    description: "Yanıt süresi ölçümü yakında eklenecek. Bu sprintte CRM yoktur.",
    kind: "placeholder" as const,
  });
}

export function createTopLeadSourcePlaceholder(): OwnerInsightsMetric {
  return Object.freeze({
    id: "top_lead_source",
    label: "En iyi talep kaynağı",
    value: "EduAtlas",
    description: "Kaynak ayrımı yakında eklenecek. Şimdilik tüm talepler EduAtlas üzerinden.",
    kind: "placeholder" as const,
  });
}

export function createGrowthTrendPlaceholder(): OwnerInsightsMetric {
  return Object.freeze({
    id: "growth_trend",
    label: "Büyüme trendi",
    value: "—",
    description: "Growth Score ve trend grafikleri sonraki sprintlerde eklenecek.",
    kind: "placeholder" as const,
  });
}
