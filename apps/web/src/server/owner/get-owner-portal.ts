import type { InstitutionRepository, LeadRepository } from "@eduatlas/application";
import {
  getOwnerDashboard,
  getOwnerLeadPipeline,
  ownerLeadUpgradeMessage,
  presentOwnerLeads,
  resolveInstitutionBillingAccess,
  type PresentedOwnerLead,
} from "@eduatlas/application";
import {
  createLeadId,
  InstitutionVerification,
  institutionIdAsString,
  type Lead,
  type LeadRole,
  leadIdAsString,
} from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import {
  getLeadStatusLabel,
  getPipelineStatusLabel,
  type OwnerLeadDetailView,
  type OwnerLeadListItemView,
  type OwnerLeadPipelineViewData,
  type OwnerLeadStatusView,
  type OwnerLeadsWorkspaceViewData,
  type OwnerPipelineStatusView,
  type OwnerPortalViewData,
} from "@eduatlas/ui";
import {
  ensureDefaultBillingPlansSeeded,
  getBillingPlanRepository,
  getInstitutionSubscriptionRepository,
} from "../billing/repository";
import { getInstitutionRepository } from "../institutions/repository";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";
import { getLeadRepository } from "./lead-repository";
import { getOwnerDemoInstitutionId } from "./owner-demo-context";

const ROLE_LABELS: Record<LeadRole, string> = {
  parent: "Ebeveyn",
  student: "Öğrenci",
  other: "Diğer",
};

export type OwnerPortalSnapshot = {
  data: OwnerPortalViewData;
};

export type GetOwnerPortalSnapshotOptions = {
  selectedLeadId?: string;
  institutionId?: string;
  institutionRepository?: InstitutionRepository;
  leadRepository?: LeadRepository;
};

/**
 * Loads owner dashboard via getOwnerDashboard application service + repositories.
 */
export async function getOwnerPortalSnapshot(
  options: GetOwnerPortalSnapshotOptions = {},
): Promise<OwnerPortalSnapshot | null> {
  const institutionId = options.institutionId ?? getOwnerDemoInstitutionId();
  const [institutionRepository, leadRepository] = await Promise.all([
    options.institutionRepository
      ? Promise.resolve(options.institutionRepository)
      : getInstitutionRepository(),
    options.leadRepository ? Promise.resolve(options.leadRepository) : getLeadRepository(),
  ]);

  const dashboard = await getOwnerDashboard(
    { institutionId },
    { institutionRepository, leadRepository },
  );

  if (!dashboard) {
    return null;
  }

  const presentedById = await buildPresentedLeadMap(institutionId, leadRepository);
  const data = toOwnerPortalViewData(dashboard, presentedById);
  let selectedLead: OwnerLeadDetailView | undefined;

  if (options.selectedLeadId) {
    const lead =
      (await leadRepository.getById(createLeadId(options.selectedLeadId))) ??
      [...dashboard.pendingLeads, ...dashboard.recentLeads].find(
        (item) => leadIdAsString(item.id) === options.selectedLeadId,
      ) ??
      null;

    if (lead && institutionIdAsString(lead.institutionId) === institutionId) {
      selectedLead = toDetail(lead, presentedById);
    }
  }

  return {
    data: {
      ...data,
      ...(selectedLead ? { selectedLead } : {}),
    },
  };
}

/**
 * Loads visual lead pipeline board data via application service.
 */
export async function getOwnerLeadPipelineView(
  options: Omit<GetOwnerPortalSnapshotOptions, "selectedLeadId"> = {},
): Promise<OwnerLeadPipelineViewData | null> {
  const institutionId = options.institutionId ?? getOwnerDemoInstitutionId();
  const [institutionRepository, leadRepository] = await Promise.all([
    options.institutionRepository
      ? Promise.resolve(options.institutionRepository)
      : getInstitutionRepository(),
    options.leadRepository ? Promise.resolve(options.leadRepository) : getLeadRepository(),
  ]);

  const dashboard = await getOwnerDashboard(
    { institutionId },
    { institutionRepository, leadRepository },
  );
  if (!dashboard) {
    return null;
  }

  const pipeline = await getOwnerLeadPipeline({ institutionId }, { leadRepository });
  const presentedById = await buildPresentedLeadMap(institutionId, leadRepository);

  return {
    institutionId,
    institutionName: dashboard.institutionSummary.institution.name,
    institutionLogoUrl: dashboard.institutionSummary.institution.logoUrl,
    totalInPipeline: pipeline.totalInPipeline,
    columns: pipeline.columns.map((column) => ({
      status: column.status as OwnerPipelineStatusView,
      title: getPipelineStatusLabel(column.status as OwnerPipelineStatusView),
      count: column.count,
      leads: column.leads.map((lead) => toListItem(lead, presentedById)),
    })),
  };
}

/**
 * Presentation bundle for the unified Talepler workspace (list + pipeline).
 * Reuses existing dashboard/pipeline services — no duplicated lead rules.
 */
export async function getOwnerLeadsWorkspaceView(
  options: Omit<GetOwnerPortalSnapshotOptions, "selectedLeadId"> = {},
): Promise<OwnerLeadsWorkspaceViewData | null> {
  const institutionId = options.institutionId ?? getOwnerDemoInstitutionId();
  const [institutionRepository, leadRepository] = await Promise.all([
    options.institutionRepository
      ? Promise.resolve(options.institutionRepository)
      : getInstitutionRepository(),
    options.leadRepository ? Promise.resolve(options.leadRepository) : getLeadRepository(),
  ]);

  const dashboard = await getOwnerDashboard(
    { institutionId },
    { institutionRepository, leadRepository },
  );
  if (!dashboard) {
    return null;
  }

  const pipeline = await getOwnerLeadPipeline({ institutionId }, { leadRepository });
  const presentedById = await buildPresentedLeadMap(institutionId, leadRepository);
  const pipelineView: OwnerLeadPipelineViewData = {
    institutionId,
    institutionName: dashboard.institutionSummary.institution.name,
    institutionLogoUrl: dashboard.institutionSummary.institution.logoUrl,
    totalInPipeline: pipeline.totalInPipeline,
    columns: pipeline.columns.map((column) => ({
      status: column.status as OwnerPipelineStatusView,
      title: getPipelineStatusLabel(column.status as OwnerPipelineStatusView),
      count: column.count,
      leads: column.leads.map((lead) => toListItem(lead, presentedById)),
    })),
  };

  const detailSource = new Map<string, Lead>();
  for (const lead of [...dashboard.pendingLeads, ...dashboard.recentLeads]) {
    detailSource.set(leadIdAsString(lead.id), lead);
  }
  for (const column of pipeline.columns) {
    for (const lead of column.leads) {
      detailSource.set(leadIdAsString(lead.id), lead);
    }
  }

  const leadDetailsById: Record<string, OwnerLeadDetailView> = {};
  for (const [id, lead] of detailSource) {
    leadDetailsById[id] = toDetail(lead, presentedById);
  }

  return {
    institutionId,
    institutionName: dashboard.institutionSummary.institution.name,
    institutionLogoUrl: dashboard.institutionSummary.institution.logoUrl,
    pendingLeads: dashboard.pendingLeads.map((lead) => toListItem(lead, presentedById)),
    recentLeads: dashboard.recentLeads.map((lead) => toListItem(lead, presentedById)),
    pipeline: pipelineView,
    leadDetailsById,
  };
}

/**
 * Loads a single lead detail for the owner detail page.
 */
export async function getOwnerLeadDetail(
  leadId: string,
  options?: Omit<GetOwnerPortalSnapshotOptions, "selectedLeadId">,
): Promise<{ institutionName: string; institutionLogoUrl?: string; lead: OwnerLeadDetailView } | null> {
  const snapshot = await getOwnerPortalSnapshot({ ...options, selectedLeadId: leadId });
  if (!snapshot?.data.selectedLead) {
    return null;
  }

  return {
    institutionName: snapshot.data.institutionName,
    institutionLogoUrl: snapshot.data.institutionLogoUrl,
    lead: snapshot.data.selectedLead,
  };
}

async function buildPresentedLeadMap(
  institutionId: string,
  leadRepository: LeadRepository,
): Promise<Map<string, PresentedOwnerLead>> {
  try {
    await ensureDefaultBillingPlansSeeded();
  } catch {
    // Seed best-effort; FREE fallback still works via defaultFreePlan.
  }

  const [allLeads, billingPlanRepository, subscriptionRepository] = await Promise.all([
    leadRepository.listByInstitutionId(institutionId),
    getBillingPlanRepository(),
    getInstitutionSubscriptionRepository(),
  ]);

  const access = await resolveInstitutionBillingAccess(institutionId, {
    billingPlanRepository,
    subscriptionRepository,
  });
  const presented = presentOwnerLeads(allLeads, access);
  return new Map(presented.map((item) => [item.lead.id.value, item]));
}

function toListItem(
  lead: Lead,
  presentedById?: Map<string, PresentedOwnerLead>,
): OwnerLeadListItemView {
  const id = leadIdAsString(lead.id);
  const status = lead.status as OwnerLeadStatusView;
  const presented = presentedById?.get(id);
  const parentName = presented?.parentName ?? lead.parentName;
  const phone = presented?.phone ?? lead.phone;
  const message = presented?.message ?? lead.message;

  return {
    id,
    parentName,
    phone,
    messagePreview: truncate(message, 120),
    status,
    statusLabel: getLeadStatusLabel(status),
    createdAtLabel: formatDateTime(lead.createdAt),
    href: `/owner/leads/${id}`,
    interestLabel: ROLE_LABELS[lead.role],
    ...(presented?.locked ? { locked: true } : {}),
  };
}

function toDetail(
  lead: Lead,
  presentedById?: Map<string, PresentedOwnerLead>,
): OwnerLeadDetailView {
  const status = lead.status as OwnerLeadStatusView;
  const id = leadIdAsString(lead.id);
  const presented = presentedById?.get(id);
  const locked = presented?.locked === true;

  return {
    id,
    parentName: presented?.parentName ?? lead.parentName,
    phone: presented?.phone ?? lead.phone,
    ...((presented?.email ?? lead.email)
      ? { email: presented?.email ?? lead.email }
      : {}),
    roleLabel: ROLE_LABELS[lead.role],
    message: presented?.message ?? lead.message,
    status,
    statusLabel: getLeadStatusLabel(status),
    ...(lead.preferredContactTime && !locked
      ? { preferredContactTime: lead.preferredContactTime }
      : {}),
    createdAtLabel: formatDateTime(lead.createdAt),
    consentAcceptedAtLabel: formatDateTime(lead.consentAcceptedAt),
    ...(locked
      ? {
          locked: true,
          upgradeMessage: ownerLeadUpgradeMessage(),
          upgradeHref: "/owner/billing",
          upgradeCtaLabel: "Ödeme yakında",
        }
      : {}),
  };
}

function toOwnerPortalViewData(
  dashboard: NonNullable<Awaited<ReturnType<typeof getOwnerDashboard>>>,
  presentedById?: Map<string, PresentedOwnerLead>,
): OwnerPortalViewData {
  const institution = dashboard.institutionSummary.institution;
  const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
  const publicProfileHref = `/institutions/${institution.slug}`;

  return {
    institutionId: institutionIdAsString(institution.id),
    institutionName: institution.name,
    institutionLogoUrl: institution.logoUrl,
    institutionSlug: institution.slug,
    publicProfileHref,
    leadCount: dashboard.leadSummary.total,
    institutionSummary: {
      name: institution.name,
      slug: institution.slug,
      typeLabel: getInstitutionTypeLabel(institution.primaryType),
      verificationLabel: verificationLabel(institution.verification),
      city: geo.cityName,
      district: geo.districtName,
      publicProfileHref,
      shortDescription: institution.shortDescription,
    },
    leadSummary: {
      total: dashboard.leadSummary.total,
      pending: dashboard.leadSummary.pending,
      newCount: dashboard.leadSummary.byPipeline.new,
      readCount: dashboard.leadSummary.byStatus.read,
      contactedCount: dashboard.leadSummary.byPipeline.contacted,
      appointmentCount: dashboard.leadSummary.byPipeline.appointment,
      enrolledCount: dashboard.leadSummary.byPipeline.enrolled,
      lostCount: dashboard.leadSummary.byPipeline.lost,
      closedCount: dashboard.leadSummary.byStatus.closed,
      spamCount: dashboard.leadSummary.byStatus.spam,
    },
    pendingLeads: dashboard.pendingLeads.map((lead) => toListItem(lead, presentedById)),
    recentLeads: dashboard.recentLeads.map((lead) => toListItem(lead, presentedById)),
    leadTrend: {
      title: dashboard.leadTrend.title,
      description: dashboard.leadTrend.description,
    },
    recommendations: {
      title: dashboard.recommendations.title,
      description: dashboard.recommendations.description,
      count: dashboard.recommendations.count,
      items: dashboard.recommendations.recommendations.map((item) => ({
        id: item.id,
        type: item.type,
        priority: item.priority,
        priorityLabel: recommendationPriorityLabel(item.priority),
        ruleId: item.ruleId,
        title: item.title,
        message: item.message,
      })),
    },
    profileCompleteness: {
      title: dashboard.profileCompleteness.title,
      overallPercentage: dashboard.profileCompleteness.overallPercentage,
      nextActionHint: dashboard.profileCompleteness.nextActionHint,
      completedCount: dashboard.profileCompleteness.completedCount,
      missingCount: dashboard.profileCompleteness.missingCount,
      missingSectionLabels: [...dashboard.profileCompleteness.missingSectionLabels],
      sections: dashboard.profileCompleteness.sections.map((section) => ({
        id: section.id,
        label: section.label,
        completed: section.completed,
        hint: section.hint,
        weight: section.weight,
      })),
      profileHref: dashboard.profileCompleteness.profileHref,
    },
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

function verificationLabel(verification: InstitutionVerification): string {
  switch (verification) {
    case InstitutionVerification.Verified:
      return "Doğrulanmış";
    case InstitutionVerification.Pending:
      return "Doğrulama bekliyor";
    case InstitutionVerification.Revoked:
      return "İptal edildi";
    default:
      return "Sahipsiz";
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
