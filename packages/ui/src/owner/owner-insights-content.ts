export type OwnerInsightsMetricView = {
  id: string;
  label: string;
  value: number | string;
  description?: string;
  kind: "metric" | "placeholder";
};

export type OwnerInsightsDistributionItemView = {
  status: string;
  label: string;
  count: number;
  percentage: number;
};

export type OwnerInsightsFunnelStepView = {
  status: string;
  label: string;
  count: number;
  percentage: number;
};

export type OwnerBusinessInsightView = {
  id: string;
  message: string;
};

export type OwnerInsightsViewData = {
  institutionId: string;
  institutionName: string;
  institutionLogoUrl?: string;
  totalLeads: number;
  newLeadsLast30Days: number;
  previousPeriodLeads: number;
  statusDistribution: readonly OwnerInsightsDistributionItemView[];
  conversionFunnel: readonly OwnerInsightsFunnelStepView[];
  profileCompleteness: {
    overallPercentage: number;
    nextActionHint: string;
    completedCount: number;
    missingCount: number;
    missingSectionLabels: readonly string[];
    profileHref: string;
  };
  averageResponseTime: OwnerInsightsMetricView;
  topLeadSource: OwnerInsightsMetricView;
  growthTrend: OwnerInsightsMetricView;
  businessInsights: readonly OwnerBusinessInsightView[];
  recommendations: readonly {
    id: string;
    type: string;
    priority: "high" | "medium" | "low";
    priorityLabel: string;
    ruleId: string;
    title: string;
    message: string;
  }[];
};
