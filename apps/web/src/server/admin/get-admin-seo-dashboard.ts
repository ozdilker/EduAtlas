import {
  SEO_OPPORTUNITY_THRESHOLDS,
  getSeoDashboard,
  type SeoActionPriority,
  type SeoDashboardPageRow,
  type SeoDashboardQueryRow,
  type SeoSearchedInstitutionRow,
  type SeoGa4InstitutionViewRow,
  type SeoManagedActionItem,
  type SeoMatchedInstitution,
  type SeoOrphanedActionTask,
} from "@eduatlas/application";
import { InstitutionVerification } from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import type {
  AdminSeoActionItem,
  AdminSeoDashboardViewData,
  AdminSeoGa4InstitutionViewRow,
  AdminSeoMatchedInstitution,
  AdminSeoOrphanedActionItem,
  AdminSeoPageRow,
  AdminSeoQueryRow,
  AdminSeoSearchedInstitutionRow,
} from "@eduatlas/ui";
import { getClaimRequestRepository } from "../claims/claim-request-repository";
import { getInstitutionRepository } from "../institutions/repository";
import { getGa4SnapshotRepository } from "../seo/ga4-snapshot-repository";
import { getSeoActionTaskRepository } from "../seo/seo-action-task-repository";
import { getSeoSnapshotRepository } from "../seo/seo-snapshot-repository";

function formatPct(ctr: number): string {
  return `${(ctr * 100).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`;
}

function formatPosition(position: number): string {
  return position.toLocaleString("tr-TR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function ownershipLabel(verification: InstitutionVerification): string {
  switch (verification) {
    case InstitutionVerification.Verified:
      return "Sahiplenilmiş";
    case InstitutionVerification.Pending:
      return "Bekliyor";
    case InstitutionVerification.Revoked:
      return "Sahiplenme geri alındı";
    default:
      return "Sahiplenilmemiş";
  }
}

function mapInstitution(
  institution: SeoMatchedInstitution,
): AdminSeoMatchedInstitution {
  const geo = resolveGeoLabels(institution.cityId, institution.districtId);
  return {
    institutionId: institution.institutionId,
    name: institution.name,
    slug: institution.slug,
    cityLabel: geo.cityName || institution.cityId,
    districtLabel: geo.districtName || institution.districtId,
    ownershipLabel: ownershipLabel(institution.verification),
    adminHref: institution.adminHref,
    profileHref: institution.profileHref,
  };
}

function mapSearchedInstitution(
  row: SeoSearchedInstitutionRow,
): AdminSeoSearchedInstitutionRow {
  const institution = mapInstitution(row.institution);
  return {
    institutionId: institution.institutionId,
    name: institution.name,
    cityLabel: institution.cityLabel,
    districtLabel: institution.districtLabel,
    profileHref: institution.profileHref,
    adminHref: institution.adminHref,
    ownershipLabel: institution.ownershipLabel,
    clicks: row.clicks,
    impressions: row.impressions,
    ctrLabel: formatPct(row.ctr),
    positionLabel: formatPosition(row.position),
  };
}

function mapPageRow(row: SeoDashboardPageRow): AdminSeoPageRow {
  return {
    url: row.url,
    clicks: row.clicks,
    impressions: row.impressions,
    ctrLabel: formatPct(row.ctr),
    positionLabel: formatPosition(row.position),
    matchStatus: row.matchStatus,
    institution: row.institution ? mapInstitution(row.institution) : null,
  };
}

function mapQueryRow(row: SeoDashboardQueryRow): AdminSeoQueryRow {
  return {
    query: row.query,
    clicks: row.clicks,
    impressions: row.impressions,
    ctrLabel: formatPct(row.ctr),
    positionLabel: formatPosition(row.position),
    matchedInstitutionName: row.matchedInstitutionName,
  };
}

function mapGa4ViewRow(row: SeoGa4InstitutionViewRow): AdminSeoGa4InstitutionViewRow {
  return {
    institutionId: row.institutionId,
    eventCount: row.eventCount,
    matchStatus: row.matchStatus,
    institutionName: row.institution?.name ?? null,
    ownershipLabel: row.institution
      ? ownershipLabel(row.institution.verification)
      : "Eşleşmedi",
    adminHref: row.institution?.adminHref ?? null,
    profileHref: row.institution?.profileHref ?? null,
  };
}

function priorityLabel(priority: SeoActionPriority): string {
  switch (priority) {
    case "high":
      return "Yüksek";
    case "medium":
      return "Orta";
    default:
      return "Düşük";
  }
}

function taskStatusLabel(status: string): string {
  switch (status) {
    case "in_progress":
      return "Devam ediyor";
    case "done":
      return "Tamamlandı";
    default:
      return "Bekliyor";
  }
}

function mapTaskView(task: SeoManagedActionItem["task"] | SeoOrphanedActionTask["task"]) {
  return {
    status: task.status,
    statusLabel: taskStatusLabel(task.status),
    assigneeUid: task.assigneeUid,
    note: task.note,
    updatedAtLabel: task.updatedAt ? formatUpdatedAt(task.updatedAt) : null,
    isPersisted: task.isPersisted,
  };
}

function mapActionItem(row: SeoManagedActionItem): AdminSeoActionItem {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    sourceKey: row.sourceKey,
    kind: row.kind,
    priority: row.priority,
    priorityLabel: priorityLabel(row.priority),
    title: row.title,
    recommendation: row.recommendation,
    targetLabel: row.targetLabel,
    clicks: row.clicks,
    impressions: row.impressions,
    ctrLabel: formatPct(row.ctr),
    positionLabel: formatPosition(row.position),
    institutionName: row.institutionName,
    profileHref: row.profileHref,
    task: mapTaskView(row.task),
  };
}

function mapOrphanedTask(row: SeoOrphanedActionTask): AdminSeoOrphanedActionItem {
  return {
    fingerprint: row.fingerprint,
    sourceKey: row.sourceKey,
    title: row.title,
    targetLabel: row.targetLabel,
    task: mapTaskView(row.task),
  };
}

function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
}

/**
 * Loads SEO + ownership + GA4 snapshot dashboard for `/admin/seo` (no Google API calls).
 */
export async function getAdminSeoDashboardView(): Promise<AdminSeoDashboardViewData> {
  const [
    seoSnapshotRepository,
    ga4SnapshotRepository,
    seoActionTaskRepository,
    institutionRepository,
    claimRequestRepository,
  ] = await Promise.all([
    getSeoSnapshotRepository(),
    getGa4SnapshotRepository(),
    getSeoActionTaskRepository(),
    getInstitutionRepository(),
    getClaimRequestRepository(),
  ]);

  const dashboard = await getSeoDashboard({
    seoSnapshotRepository,
    ga4SnapshotRepository,
    seoActionTaskRepository,
    institutionRepository,
    claimRequestRepository,
  });

  return {
    title: "SEO ve Kurum Yönetimi",
    subtitle:
      "Search Console fırsatları, öncelikli aksiyonlar, görev takibi ve sahiplik özeti.",
    hasSnapshot: dashboard.hasSnapshot,
    updatedAtLabel: formatUpdatedAt(dashboard.updatedAt),
    dateRangeLabel: dashboard.dateRange
      ? `${dashboard.dateRange.startDate} → ${dashboard.dateRange.endDate}`
      : null,
    summary: dashboard.summary
      ? {
          clicksLabel: formatInt(dashboard.summary.clicks),
          impressionsLabel: formatInt(dashboard.summary.impressions),
          ctrLabel: formatPct(dashboard.summary.ctr),
          positionLabel: formatPosition(dashboard.summary.position),
        }
      : null,
    topSearchedInstitutions: dashboard.topSearchedInstitutions.map(mapSearchedInstitution),
    siteSearch: dashboard.siteSearch,
    topInstitutionPages: dashboard.topInstitutionPages.map(mapPageRow),
    topQueries: dashboard.topQueries.map(mapQueryRow),
    lowCtrPages: dashboard.opportunities.lowCtrPages.map((row) => {
      const resolved =
        dashboard.topInstitutionPages.find((page) => page.url === row.url) ??
        dashboard.unmatchedPages.find((page) => page.url === row.url);
      if (resolved) return mapPageRow(resolved);
      return mapPageRow({
        ...row,
        matchStatus: "not_institution",
        institution: null,
      });
    }),
    midPositionQueries: dashboard.opportunities.midPositionQueries.map((row) => {
      const resolved = dashboard.topQueries.find((query) => query.query === row.query);
      return mapQueryRow(resolved ?? { ...row, matchedInstitutionName: null });
    }),
    unmatchedPages: dashboard.unmatchedPages.map(mapPageRow),
    actionPlan: {
      activeActions: dashboard.actionPlan.activeActions.map(mapActionItem),
      completedActions: dashboard.actionPlan.completedActions.map(mapActionItem),
      prioritizedActions: dashboard.actionPlan.prioritizedActions.map(mapActionItem),
      ctrPageOpportunities: dashboard.actionPlan.ctrPageOpportunities.map(mapActionItem),
      rankingPageOpportunities:
        dashboard.actionPlan.rankingPageOpportunities.map(mapActionItem),
      queryOpportunities: dashboard.actionPlan.queryOpportunities.map(mapActionItem),
      unmatchedUrlOpportunities:
        dashboard.actionPlan.unmatchedUrlOpportunities.map(mapActionItem),
      orphanedTasks: dashboard.actionPlan.orphanedTasks.map(mapOrphanedTask),
    },
    ownership: dashboard.ownership,
    opportunityThresholdsLabel: `Düşük CTR: gösterim ≥ ${SEO_OPPORTUNITY_THRESHOLDS.lowCtrMinImpressions} ve CTR < %${SEO_OPPORTUNITY_THRESHOLDS.lowCtrMaxCtr * 100}. Sıralama: pozisyon ${SEO_OPPORTUNITY_THRESHOLDS.midPositionMin}–${SEO_OPPORTUNITY_THRESHOLDS.midPositionMax} ve gösterim ≥ ${SEO_OPPORTUNITY_THRESHOLDS.midPositionMinImpressions}. Öncelik: ≥500 yüksek, ≥200 orta.`,
    ga4: {
      hasSnapshot: dashboard.ga4.hasSnapshot,
      updatedAtLabel: formatUpdatedAt(dashboard.ga4.updatedAt),
      dateRangeLabel: dashboard.ga4.dateRange
        ? `${dashboard.ga4.dateRange.startDate} → ${dashboard.ga4.dateRange.endDate}`
        : null,
      totalInstitutionViewsLabel: dashboard.ga4.summary
        ? formatInt(dashboard.ga4.summary.totalInstitutionViews)
        : null,
      topInstitutionViews: dashboard.ga4.topInstitutionViews.map(mapGa4ViewRow),
      unmatchedCount: dashboard.ga4.unmatchedCount,
      searchTermInstrumented: dashboard.ga4.searchTermInstrumented,
      eventsInstrumented: dashboard.ga4.eventsInstrumented,
      analyticsConsoleHref: dashboard.ga4.analyticsConsoleHint,
      searchConsoleHref: "https://search.google.com/search-console",
      emptyStateMessage:
        "Henüz `ga4_snapshots/latest` yok. Controlled CLI ile GA4 institution_view snapshot yazıldıktan sonra bu bölüm dolar.",
      snapshotCommandHint:
        "npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/write-seo-ga4-snapshot.ts",
    },
    emptyStateMessage:
      "Henüz `seo_snapshots/latest` yok. Controlled CLI ile GSC snapshot yazıldıktan sonra bu özet dolar. Sahiplik sayıları snapshot olmadan da görünür.",
    snapshotCommandHint:
      "npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/write-seo-gsc-snapshot.ts",
  };
}
