import type {
  Institution,
  InstitutionLeadCounters,
  InstitutionProfileCompleteness,
  Lead,
  LeadStatus,
  OwnerRecommendation,
} from "@eduatlas/domain";

/**
 * Aggregated lead counts for the owner dashboard (includes pipeline stages).
 */
export type OwnerLeadSummary = Readonly<{
  readonly total: number;
  readonly pending: number;
  readonly byStatus: Readonly<{
    readonly new: number;
    readonly read: number;
    readonly contacted: number;
    readonly appointment: number;
    readonly enrolled: number;
    readonly lost: number;
    readonly closed: number;
    readonly spam: number;
  }>;
  readonly byPipeline: Readonly<{
    readonly new: number;
    readonly contacted: number;
    readonly appointment: number;
    readonly enrolled: number;
    readonly lost: number;
  }>;
}>;

/**
 * Institution slice shown on the owner dashboard.
 */
export type OwnerInstitutionSummary = Readonly<{
  readonly institution: Institution;
}>;

/**
 * Placeholder for future lead trend charts (no CRM / analytics wiring yet).
 */
export type OwnerLeadTrendPlaceholder = Readonly<{
  readonly kind: "placeholder";
  readonly title: string;
  readonly description: string;
}>;

/**
 * Live profile + lead rule recommendations (read-only).
 */
export type OwnerRecommendationsPanel = Readonly<{
  readonly title: string;
  readonly description: string;
  readonly recommendations: readonly OwnerRecommendation[];
  readonly count: number;
}>;

/**
 * Single completeness section for owner surfaces (dashboard / onboarding).
 */
export type OwnerProfileCompletenessSectionPanel = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly completed: boolean;
  readonly hint: string;
  readonly weight: number;
}>;

/**
 * Profile Completeness card data for the owner dashboard (not Growth Score).
 */
export type OwnerProfileCompletenessPanel = Readonly<{
  readonly title: string;
  readonly overallPercentage: number;
  readonly nextActionHint: string;
  readonly completedCount: number;
  readonly missingCount: number;
  readonly missingSectionLabels: readonly string[];
  readonly sections: readonly OwnerProfileCompletenessSectionPanel[];
  readonly profileHref: string;
}>;

/**
 * Application-layer owner dashboard aggregate — repository-backed, no Firebase.
 */
export type OwnerDashboard = Readonly<{
  readonly institutionSummary: OwnerInstitutionSummary;
  readonly leadSummary: OwnerLeadSummary;
  readonly pendingLeads: readonly Lead[];
  readonly recentLeads: readonly Lead[];
  readonly leadTrend: OwnerLeadTrendPlaceholder;
  readonly recommendations: OwnerRecommendationsPanel;
  readonly profileCompleteness: OwnerProfileCompletenessPanel;
}>;

export type BuildOwnerLeadSummaryInput = {
  leads: readonly Lead[];
};

/**
 * Aggregates lead status counts. Pending = `new` (awaiting owner action).
 */
export function buildOwnerLeadSummary(input: BuildOwnerLeadSummaryInput): OwnerLeadSummary {
  const byStatus = {
    new: 0,
    read: 0,
    contacted: 0,
    appointment: 0,
    enrolled: 0,
    lost: 0,
    closed: 0,
    spam: 0,
  };

  for (const lead of input.leads) {
    const key = lead.status as keyof typeof byStatus;
    if (key in byStatus) {
      byStatus[key] += 1;
    }
  }

  const byPipeline = Object.freeze({
    new: byStatus.new,
    contacted: byStatus.contacted,
    appointment: byStatus.appointment,
    enrolled: byStatus.enrolled,
    lost: byStatus.lost,
  });

  return Object.freeze({
    total: input.leads.length,
    pending: byStatus.new,
    byStatus: Object.freeze(byStatus),
    byPipeline,
  });
}

/**
 * Builds owner dashboard lead summary from denormalized institution lead counters.
 */
export function buildOwnerLeadSummaryFromCounters(
  counters: InstitutionLeadCounters,
): OwnerLeadSummary {
  return Object.freeze({
    total: counters.total,
    pending: counters.pending,
    byStatus: Object.freeze({ ...counters.byStatus }),
    byPipeline: Object.freeze({ ...counters.byPipeline }),
  });
}

/**
 * Returns newest-first leads with the given status.
 */
export function selectLeadsByStatus(
  leads: readonly Lead[],
  status: LeadStatus,
  limit: number,
): readonly Lead[] {
  return Object.freeze(leads.filter((lead) => lead.status === status).slice(0, limit));
}

/**
 * Returns newest-first recent leads (repository list is already sorted).
 */
export function selectRecentLeads(leads: readonly Lead[], limit: number): readonly Lead[] {
  return Object.freeze(leads.slice(0, limit));
}

export function createOwnerLeadTrendPlaceholder(): OwnerLeadTrendPlaceholder {
  return Object.freeze({
    kind: "placeholder" as const,
    title: "Talep trendi",
    description:
      "Haftalık talep grafiği yakında eklenecek. Bu sprintte bildirim, CRM ve faturalandırma yoktur.",
  });
}

export function createOwnerRecommendationsPanel(
  recommendations: readonly OwnerRecommendation[],
): OwnerRecommendationsPanel {
  return Object.freeze({
    title: "Satış önerileri",
    description:
      "Kurum profiliniz ve detay sayfanız analiz edilerek oluşturuldu. Öneriler salt okunurdur; otomatik işlem yoktur.",
    recommendations: Object.freeze([...recommendations]),
    count: recommendations.length,
  });
}

export function createOwnerProfileCompletenessPanel(
  completeness: InstitutionProfileCompleteness,
  profileHref = "/owner/profile",
): OwnerProfileCompletenessPanel {
  return Object.freeze({
    title: "Profil tamamlanma",
    overallPercentage: completeness.overallPercentage,
    nextActionHint: completeness.nextActionHint,
    completedCount: completeness.completedSections.length,
    missingCount: completeness.missingSections.length,
    missingSectionLabels: Object.freeze(
      completeness.missingSections.map((section) => section.label),
    ),
    sections: Object.freeze(
      completeness.sections.map((section) =>
        Object.freeze({
          id: section.id,
          label: section.label,
          completed: section.completed,
          hint: section.hint,
          weight: section.weight,
        }),
      ),
    ),
    profileHref,
  });
}
