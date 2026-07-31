import {
  type AcquisitionOwnershipFilter,
  type AcquisitionQualitySort,
  type AcquisitionQueueId,
  getInstitutionAcquisitionDashboard,
  type InstitutionAcquisitionDashboard,
} from "@eduatlas/application";
import {
  type ClaimRequest,
  ClaimRequestStatus,
  claimRequestIdAsString,
  type InstitutionStatus,
  type InstitutionType,
  type InstitutionVerification,
  institutionIdAsString,
  isInstitutionStatus,
  isInstitutionType,
  isInstitutionVerification,
} from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import {
  ADMIN_ACQUISITION_OWNERSHIP_OPTIONS,
  ADMIN_ACQUISITION_PAGE_SIZE,
  ADMIN_ACQUISITION_SORT_OPTIONS,
  ADMIN_ACQUISITION_STATUS_OPTIONS,
  ADMIN_ACQUISITION_TYPE_OPTIONS,
  ADMIN_ACQUISITION_VERIFICATION_OPTIONS,
  type AdminAcquisitionDashboardViewData,
  type AdminAcquisitionQualitySort,
  type AdminAcquisitionQueueId,
  buildAdminAcquisitionPageNumbers,
  buildAdminAcquisitionQueueTabs,
  buildAdminQualityIndicatorLabels,
  getAdminAcquisitionOwnershipLabel,
  getAdminAcquisitionQualityBandLabel,
  getAdminAcquisitionQualityLevelLabel,
  getAdminAcquisitionStatusLabel,
  getAdminAcquisitionVerificationLabel,
} from "@eduatlas/ui";
import { getClaimRequestRepository } from "../claims/claim-request-repository";
import { getInstitutionRepository } from "../institutions/repository";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

export type AcquisitionSearchParams = {
  queue?: string | string[];
  cityId?: string | string[];
  districtId?: string | string[];
  primaryType?: string | string[];
  verification?: string | string[];
  ownership?: string | string[];
  status?: string | string[];
  sort?: string | string[];
  q?: string | string[];
  page?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

const QUEUE_IDS = new Set<AdminAcquisitionQueueId>([
  "all",
  "import",
  "pending",
  "verified",
  "claimed",
  "duplicates",
]);

const SORT_IDS = new Set<AdminAcquisitionQualitySort>(["highest", "lowest", "missing_fields"]);

function parseQueue(raw: string | undefined): AcquisitionQueueId {
  if (raw && QUEUE_IDS.has(raw as AdminAcquisitionQueueId)) {
    return raw as AcquisitionQueueId;
  }
  return "all";
}

function parseSort(raw: string | undefined): AcquisitionQualitySort {
  if (raw && SORT_IDS.has(raw as AdminAcquisitionQualitySort)) {
    return raw as AcquisitionQualitySort;
  }
  return "highest";
}

function parseOwnership(raw: string | undefined): AcquisitionOwnershipFilter | undefined {
  if (raw === "claimed" || raw === "unclaimed") {
    return raw;
  }
  return undefined;
}

function parsePage(raw: string | undefined): number {
  const value = Number.parseInt(raw || "1", 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/**
 * Loads Institution Acquisition Dashboard view data via repository + application service.
 */
export async function getAdminAcquisitionDashboardView(
  searchParams: AcquisitionSearchParams = {},
): Promise<AdminAcquisitionDashboardViewData> {
  const cityId = firstParam(searchParams.cityId)?.trim();
  const districtId = firstParam(searchParams.districtId)?.trim();
  const primaryTypeRaw = firstParam(searchParams.primaryType)?.trim();
  const verificationRaw = firstParam(searchParams.verification)?.trim();
  const statusRaw = firstParam(searchParams.status)?.trim();
  const query = firstParam(searchParams.q)?.trim();
  const ownership = parseOwnership(firstParam(searchParams.ownership)?.trim());
  const sort = parseSort(firstParam(searchParams.sort)?.trim());
  const page = parsePage(firstParam(searchParams.page)?.trim());

  const primaryType =
    primaryTypeRaw && isInstitutionType(primaryTypeRaw)
      ? (primaryTypeRaw as InstitutionType)
      : undefined;
  const verification =
    verificationRaw && isInstitutionVerification(verificationRaw)
      ? (verificationRaw as InstitutionVerification)
      : undefined;
  const status =
    statusRaw && isInstitutionStatus(statusRaw) ? (statusRaw as InstitutionStatus) : undefined;

  const [institutionRepository, claimRequestRepository] = await Promise.all([
    getInstitutionRepository(),
    getClaimRequestRepository(),
  ]);
  const [dashboard, pendingClaims] = await Promise.all([
    getInstitutionAcquisitionDashboard(
      {
        queue: parseQueue(firstParam(searchParams.queue)?.trim()),
        sort,
        page,
        pageSize: ADMIN_ACQUISITION_PAGE_SIZE,
        ...(cityId ? { cityId } : {}),
        ...(cityId && districtId ? { districtId } : {}),
        ...(primaryType ? { primaryType } : {}),
        ...(verification ? { verification } : {}),
        ...(status ? { status } : {}),
        ...(ownership ? { ownership } : {}),
        ...(query ? { query } : {}),
      },
      {
        institutionRepository,
        resolveCityLabel: (id) => resolveGeoLabels(id, "dist_unknown").cityName,
        resolveDistrictLabel: (cId, dId) => resolveGeoLabels(cId, dId).districtName,
        resolveTypeLabel: getInstitutionTypeLabel,
      },
    ),
    claimRequestRepository.listRecent({
      status: ClaimRequestStatus.Pending,
      limit: 500,
    }),
  ]);

  return toAdminAcquisitionDashboardViewData(dashboard, pendingClaims);
}

function buildPendingClaimByInstitutionId(
  pendingClaims: readonly ClaimRequest[],
): ReadonlyMap<string, ClaimRequest> {
  const map = new Map<string, ClaimRequest>();
  for (const claim of pendingClaims) {
    const institutionId = claim.institutionId.value;
    if (!map.has(institutionId)) {
      map.set(institutionId, claim);
    }
  }
  return map;
}

function toAdminAcquisitionDashboardViewData(
  dashboard: InstitutionAcquisitionDashboard,
  pendingClaims: readonly ClaimRequest[],
): AdminAcquisitionDashboardViewData {
  const pendingByInstitution = buildPendingClaimByInstitutionId(pendingClaims);
  const filters = Object.freeze({
    cityId: dashboard.filters.cityId ?? "",
    districtId: dashboard.filters.districtId ?? "",
    primaryType: dashboard.filters.primaryType ?? "",
    verification: dashboard.filters.verification ?? "",
    ownership: dashboard.filters.ownership ?? "",
    status: dashboard.filters.status ?? "",
  });
  const searchQuery = dashboard.filters.query ?? "";
  const queueCounts = dashboard.statistics.queueCounts;
  const progressPercent =
    queueCounts.all === 0
      ? 0
      : Math.min(
          100,
          Math.round(((queueCounts.verified + queueCounts.claimed) / (queueCounts.all * 2)) * 100),
        );

  const rows = Object.freeze(
    dashboard.rows.map((row) => {
      const institution = row.institution;
      const institutionId = institutionIdAsString(institution.id);
      const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
      const labels = buildAdminQualityIndicatorLabels(row.qualityIndicators);
      const pendingClaim = pendingByInstitution.get(institutionId);
      return Object.freeze({
        id: institutionId,
        name: institution.name,
        slug: institution.slug,
        typeLabel: getInstitutionTypeLabel(institution.primaryType),
        cityLabel: geo.cityName,
        districtLabel: geo.districtName,
        statusLabel: getAdminAcquisitionStatusLabel(institution.status),
        verificationLabel: getAdminAcquisitionVerificationLabel(institution.verification),
        ownershipLabel: getAdminAcquisitionOwnershipLabel(institution.verification),
        qualityScore: row.quality.score,
        qualityGrade: row.quality.grade,
        qualityLevelLabel: getAdminAcquisitionQualityLevelLabel(row.quality.qualityLevel),
        qualityBandLabel: getAdminAcquisitionQualityBandLabel(row.quality.score),
        missingFields: row.quality.missingFields,
        qualityIssueMessages: row.quality.qualityIssues.map((issue) => issue.message),
        recommendationTitles: row.recommendations.map((item) => item.title),
        indicators: Object.freeze({
          ...row.qualityIndicators,
          labels,
        }),
        isDuplicateCandidate: Boolean(row.duplicateGroupKey),
        profileHref: `/institutions/${institution.slug}`,
        pendingClaim: pendingClaim
          ? Object.freeze({
              claimRequestId: claimRequestIdAsString(pendingClaim.id),
              applicantName: pendingClaim.applicantName,
              applicantEmail: pendingClaim.email,
            })
          : null,
      });
    }),
  ) as AdminAcquisitionDashboardViewData["rows"];

  return Object.freeze({
    title: "Kurum edinimi",
    subtitle:
      "Ulusal katalog operasyonları için kuyruk, iç kalite skoru ve sahiplik görünümü. Growth Score değildir.",
    generatedAtLabel: new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dashboard.generatedAt)),
    activeQueue: dashboard.queue,
    activeSort: dashboard.sort,
    queueTabs: buildAdminAcquisitionQueueTabs({
      activeQueue: dashboard.queue,
      queueCounts,
      filters,
      searchQuery,
      sort: dashboard.sort,
    }),
    sortOptions: ADMIN_ACQUISITION_SORT_OPTIONS,
    searchQuery,
    filters,
    cityOptions: Object.freeze(
      dashboard.availableCities.map((item) =>
        Object.freeze({ value: item.id, label: `${item.label} (${item.count})` }),
      ),
    ),
    districtOptions: Object.freeze(
      dashboard.availableDistricts
        .filter((item) => !filters.cityId || item.id.startsWith(`${filters.cityId}::`))
        .map((item) => {
          const districtId = item.id.includes("::") ? (item.id.split("::")[1] ?? item.id) : item.id;
          return Object.freeze({
            value: districtId,
            label: `${item.label} (${item.count})`,
          });
        }),
    ),
    typeOptions: ADMIN_ACQUISITION_TYPE_OPTIONS,
    verificationOptions: ADMIN_ACQUISITION_VERIFICATION_OPTIONS,
    ownershipOptions: ADMIN_ACQUISITION_OWNERSHIP_OPTIONS,
    statusOptions: ADMIN_ACQUISITION_STATUS_OPTIONS,
    statistics: Object.freeze({
      totalInstitutions: dashboard.statistics.totalInstitutions,
      claimRatePercent: dashboard.statistics.claimRatePercent,
      verificationRatePercent: dashboard.statistics.verificationRatePercent,
      averageQualityScore: dashboard.statistics.qualityDistribution.averageScore,
      byCity: dashboard.statistics.byCity,
      byType: Object.freeze(
        dashboard.statistics.byType.map((item) =>
          Object.freeze({
            id: item.id,
            label: isInstitutionType(item.id) ? getInstitutionTypeLabel(item.id) : item.label,
            count: item.count,
          }),
        ),
      ),
      qualityDistribution: Object.freeze({
        low: dashboard.statistics.qualityDistribution.low,
        medium: dashboard.statistics.qualityDistribution.medium,
        healthy: dashboard.statistics.qualityDistribution.healthy,
        excellent: dashboard.statistics.qualityDistribution.excellent,
        byGrade: dashboard.statistics.qualityDistribution.byGrade,
        byLevel: dashboard.statistics.qualityDistribution.byLevel,
      }),
      progressPercent,
    }),
    filteredCount: dashboard.matchedCount,
    pagination: Object.freeze({
      page: dashboard.pagination.page,
      pageSize: dashboard.pagination.pageSize,
      totalPages: dashboard.pagination.totalPages,
      totalItems: dashboard.pagination.totalItems,
      from: dashboard.pagination.from,
      to: dashboard.pagination.to,
      pageNumbers: buildAdminAcquisitionPageNumbers(
        dashboard.pagination.page,
        dashboard.pagination.totalPages,
      ),
    }),
    rows,
    duplicateCandidates: Object.freeze(
      dashboard.duplicateCandidates.map((item) =>
        Object.freeze({
          id: item.groupKey,
          label: item.label,
          count: item.count,
        }),
      ),
    ),
    bulkActionsNote:
      "Satırdaki Onayla ile bekleyen sahiplenme taleplerini onaylayabilirsiniz. Toplu onay, red, atama ve birleştirme henüz bağlı değildir.",
  });
}
