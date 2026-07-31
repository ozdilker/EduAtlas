export type OwnerLeadStatusView =
  | "new"
  | "read"
  | "contacted"
  | "appointment"
  | "enrolled"
  | "lost"
  | "closed"
  | "spam";

export type OwnerPipelineStatusView = "new" | "contacted" | "appointment" | "enrolled" | "lost";

export type OwnerLeadListItemView = {
  id: string;
  parentName: string;
  phone: string;
  messagePreview: string;
  status: OwnerLeadStatusView;
  statusLabel: string;
  createdAtLabel: string;
  href: string;
  /** Presentation label for interest/role context (e.g. Ebeveyn / Öğrenci). */
  interestLabel?: string;
};

export type OwnerLeadDetailView = {
  id: string;
  parentName: string;
  phone: string;
  email?: string;
  roleLabel: string;
  message: string;
  status: OwnerLeadStatusView;
  statusLabel: string;
  preferredContactTime?: string;
  createdAtLabel: string;
  consentAcceptedAtLabel: string;
};

export type OwnerInstitutionSummaryView = {
  name: string;
  slug: string;
  typeLabel: string;
  verificationLabel: string;
  city: string;
  district: string;
  publicProfileHref: string;
  shortDescription?: string;
};

export type OwnerLeadSummaryView = {
  total: number;
  pending: number;
  newCount: number;
  readCount: number;
  contactedCount: number;
  appointmentCount: number;
  enrolledCount: number;
  lostCount: number;
  closedCount: number;
  spamCount: number;
};

export type OwnerLeadTrendPlaceholderView = {
  title: string;
  description: string;
};

export type OwnerRecommendationView = {
  id: string;
  type: string;
  priority: "high" | "medium" | "low";
  priorityLabel: string;
  ruleId: string;
  title: string;
  message: string;
};

export type OwnerRecommendationsView = {
  title: string;
  description: string;
  count: number;
  items: readonly OwnerRecommendationView[];
};

export type OwnerProfileCompletenessSectionView = {
  id: string;
  label: string;
  completed: boolean;
  hint: string;
  weight: number;
};

export type OwnerProfileCompletenessView = {
  title: string;
  overallPercentage: number;
  nextActionHint: string;
  completedCount: number;
  missingCount: number;
  missingSectionLabels: readonly string[];
  sections: readonly OwnerProfileCompletenessSectionView[];
  profileHref: string;
};

export type OwnerPipelineColumnView = {
  status: OwnerPipelineStatusView;
  title: string;
  count: number;
  leads: OwnerLeadListItemView[];
};

export type OwnerLeadPipelineViewData = {
  institutionId: string;
  institutionName: string;
  institutionLogoUrl?: string;
  columns: OwnerPipelineColumnView[];
  totalInPipeline: number;
};

export type OwnerLeadsWorkspaceView = "list" | "pipeline";

export type OwnerLeadsWorkspaceViewData = {
  institutionId: string;
  institutionName: string;
  institutionLogoUrl?: string;
  pendingLeads: OwnerLeadListItemView[];
  recentLeads: OwnerLeadListItemView[];
  pipeline: OwnerLeadPipelineViewData;
  /** Detail payloads keyed by lead id — powers the client drawer without a reload. */
  leadDetailsById: Readonly<Record<string, OwnerLeadDetailView>>;
};

export type OwnerPortalViewData = {
  institutionId: string;
  institutionName: string;
  institutionLogoUrl?: string;
  institutionSlug: string;
  publicProfileHref: string;
  leadCount: number;
  institutionSummary: OwnerInstitutionSummaryView;
  leadSummary: OwnerLeadSummaryView;
  pendingLeads: OwnerLeadListItemView[];
  recentLeads: OwnerLeadListItemView[];
  leadTrend: OwnerLeadTrendPlaceholderView;
  recommendations: OwnerRecommendationsView;
  profileCompleteness: OwnerProfileCompletenessView;
  selectedLead?: OwnerLeadDetailView;
};

export const OWNER_PIPELINE_STATUSES: readonly OwnerPipelineStatusView[] = [
  "new",
  "contacted",
  "appointment",
  "enrolled",
  "lost",
] as const;

export function getLeadStatusLabel(status: OwnerLeadStatusView): string {
  switch (status) {
    case "new":
      return "Yeni";
    case "read":
      return "Okundu";
    case "contacted":
      return "İletişim kuruldu";
    case "appointment":
      return "Randevu";
    case "enrolled":
      return "Kayıt";
    case "lost":
      return "Kayıp";
    case "closed":
      return "Kapatıldı";
    case "spam":
      return "Spam";
    default:
      return status;
  }
}

export function getPipelineStatusLabel(status: OwnerPipelineStatusView): string {
  switch (status) {
    case "new":
      return "Yeni";
    case "contacted":
      return "İletişim";
    case "appointment":
      return "Randevu";
    case "enrolled":
      return "Kayıt";
    case "lost":
      return "Kayıp";
    default:
      return status;
  }
}
