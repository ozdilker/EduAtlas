import {
  getInstitutionReviewQueue,
  type InstitutionReviewQueue,
  type ReviewQualityBand,
  type ReviewQueueId,
  type ReviewQueueRow,
  type ReviewSort,
} from "@eduatlas/application";
import {
  GoogleBusinessMatchMethod,
  GoogleBusinessSyncStatus,
  type InstitutionStatus,
  type InstitutionType,
  institutionIdAsString,
  isInstitutionStatus,
  isInstitutionType,
} from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import {
  ADMIN_ACQUISITION_STATUS_OPTIONS,
  ADMIN_ACQUISITION_TYPE_OPTIONS,
  ADMIN_REVIEW_QUALITY_BAND_OPTIONS,
  ADMIN_REVIEW_SORT_OPTIONS,
  type AdminReviewPanelView,
  type AdminReviewQueueId,
  type AdminReviewQueueViewData,
  type AdminReviewSort,
  buildAdminReviewHref,
  buildAdminReviewQueueTabs,
  getAdminAcquisitionQualityLevelLabel,
  getAdminAcquisitionStatusLabel,
} from "@eduatlas/ui";
import { getInstitutionRepository } from "../institutions/repository";
import { getInstitutionTypeLabel } from "../institutions/to-profile-view";

export type ReviewSearchParams = {
  queue?: string | string[];
  sort?: string | string[];
  cityId?: string | string[];
  districtId?: string | string[];
  primaryType?: string | string[];
  qualityBand?: string | string[];
  status?: string | string[];
  q?: string | string[];
  selected?: string | string[];
  notice?: string | string[];
  noticeTone?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const QUEUE_IDS = new Set<AdminReviewQueueId>([
  "draft",
  "needs_review",
  "ready",
  "published",
  "rejected",
]);
const SORT_IDS = new Set<AdminReviewSort>(["newest", "highest", "lowest"]);
const BAND_IDS = new Set<ReviewQualityBand>(["low", "medium", "healthy", "excellent"]);

function parseQueue(raw: string | undefined): ReviewQueueId {
  return raw && QUEUE_IDS.has(raw as AdminReviewQueueId) ? (raw as ReviewQueueId) : "draft";
}

function parseSort(raw: string | undefined): ReviewSort {
  return raw && SORT_IDS.has(raw as AdminReviewSort) ? (raw as ReviewSort) : "newest";
}

function parseBand(raw: string | undefined): ReviewQualityBand | undefined {
  return raw && BAND_IDS.has(raw as ReviewQualityBand) ? (raw as ReviewQualityBand) : undefined;
}

/**
 * Loads Institution Review Queue view data via repository + application service.
 */
export async function getAdminReviewQueueView(
  searchParams: ReviewSearchParams = {},
): Promise<AdminReviewQueueViewData> {
  const cityId = firstParam(searchParams.cityId)?.trim();
  const districtId = firstParam(searchParams.districtId)?.trim();
  const primaryTypeRaw = firstParam(searchParams.primaryType)?.trim();
  const statusRaw = firstParam(searchParams.status)?.trim();
  const query = firstParam(searchParams.q)?.trim();
  const selectedId = firstParam(searchParams.selected)?.trim();
  const qualityBand = parseBand(firstParam(searchParams.qualityBand)?.trim());
  const queue = parseQueue(firstParam(searchParams.queue)?.trim());
  const sort = parseSort(firstParam(searchParams.sort)?.trim());
  const notice = firstParam(searchParams.notice)?.trim() ?? "";
  const noticeToneRaw = firstParam(searchParams.noticeTone)?.trim();

  const primaryType =
    primaryTypeRaw && isInstitutionType(primaryTypeRaw)
      ? (primaryTypeRaw as InstitutionType)
      : undefined;
  const status =
    statusRaw && isInstitutionStatus(statusRaw) ? (statusRaw as InstitutionStatus) : undefined;

  const institutionRepository = await getInstitutionRepository();
  const result = await getInstitutionReviewQueue(
    {
      queue,
      sort,
      ...(cityId ? { cityId } : {}),
      ...(cityId && districtId ? { districtId } : {}),
      ...(primaryType ? { primaryType } : {}),
      ...(qualityBand ? { qualityBand } : {}),
      ...(status ? { status } : {}),
      ...(query ? { query } : {}),
      ...(selectedId ? { selectedId } : {}),
    },
    {
      institutionRepository,
      resolveCityLabel: (id) => resolveGeoLabels(id, "dist_unknown").cityName,
      resolveDistrictLabel: (cId, dId) => resolveGeoLabels(cId, dId).districtName,
    },
  );

  const locationNotice = result.searchNotice?.trim() ?? "";
  const effectiveNotice = locationNotice || notice;
  const effectiveTone: "info" | "error" | "" = locationNotice
    ? "info"
    : noticeToneRaw === "error"
      ? "error"
      : notice
        ? "info"
        : "";

  return toAdminReviewQueueViewData(result, {
    notice: effectiveNotice,
    noticeTone: effectiveTone,
  });
}

function toAdminReviewQueueViewData(
  result: InstitutionReviewQueue,
  feedback: { notice: string; noticeTone: "info" | "error" | "" },
): AdminReviewQueueViewData {
  const filters = Object.freeze({
    cityId: result.filters.cityId ?? "",
    districtId: result.filters.districtId ?? "",
    primaryType: result.filters.primaryType ?? "",
    qualityBand: result.filters.qualityBand ?? "",
    status: result.filters.status ?? "",
  });
  const searchQuery = result.filters.query ?? "";

  const dateFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

  const rows = Object.freeze(
    result.rows.map((row) => {
      const institution = row.institution;
      const id = institutionIdAsString(institution.id);
      const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
      return Object.freeze({
        id,
        name: institution.name,
        slug: institution.slug,
        typeLabel: getInstitutionTypeLabel(institution.primaryType),
        cityLabel: geo.cityName,
        districtLabel: geo.districtName,
        statusLabel: getAdminAcquisitionStatusLabel(institution.status),
        createdAtLabel: dateFormat.format(new Date(institution.createdAt)),
        qualityScore: row.quality.score,
        qualityGrade: row.quality.grade,
        qualityLevelLabel: getAdminAcquisitionQualityLevelLabel(row.quality.qualityLevel),
        missingFieldCount: row.quality.missingFields.length,
        isDuplicateCandidate: row.isDuplicateCandidate,
        publishReady: institution.status !== "published" && row.publishValidation.ok,
        reviewHref: buildAdminReviewHref({
          queue: result.queue,
          sort: result.sort,
          filters,
          searchQuery,
          selectedId: id,
        }),
      });
    }),
  ) as AdminReviewQueueViewData["rows"];

  return Object.freeze({
    title: "İnceleme kuyruğu",
    subtitle:
      "İçe aktarılan her kurum yayına alınmadan önce insan incelemesinden geçer. Otomasyon ve AI yoktur.",
    generatedAtLabel: new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(result.generatedAt)),
    activeQueue: result.queue,
    activeSort: result.sort,
    queueTabs: buildAdminReviewQueueTabs({
      activeQueue: result.queue,
      queueCounts: result.queueCounts,
      sort: result.sort,
      filters,
      searchQuery,
    }),
    searchQuery,
    filters,
    sortOptions: ADMIN_REVIEW_SORT_OPTIONS,
    cityOptions: Object.freeze(
      result.availableCities.map((item) =>
        Object.freeze({ value: item.id, label: `${item.label} (${item.count})` }),
      ),
    ),
    districtOptions: Object.freeze(
      result.availableDistricts
        .filter((item) => !filters.cityId || item.id.startsWith(`${filters.cityId}::`))
        .map((item) => {
          const districtId = item.id.includes("::") ? (item.id.split("::")[1] ?? item.id) : item.id;
          return Object.freeze({ value: districtId, label: `${item.label} (${item.count})` });
        }),
    ),
    typeOptions: ADMIN_ACQUISITION_TYPE_OPTIONS,
    qualityBandOptions: ADMIN_REVIEW_QUALITY_BAND_OPTIONS,
    statusOptions: ADMIN_ACQUISITION_STATUS_OPTIONS,
    rows,
    selected: result.selected ? toPanelView(result.selected) : null,
    notice: feedback.notice,
    noticeTone: feedback.noticeTone,
    returnTo: buildAdminReviewHref({
      queue: result.queue,
      sort: result.sort,
      filters,
      searchQuery,
      ...(result.selected
        ? { selectedId: institutionIdAsString(result.selected.institution.id) }
        : {}),
    }),
  });
}

function toPanelView(row: ReviewQueueRow): AdminReviewPanelView {
  const institution = row.institution;
  const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
  const status = institution.status;

  return Object.freeze({
    id: institutionIdAsString(institution.id),
    name: institution.name,
    slug: institution.slug,
    typeLabel: getInstitutionTypeLabel(institution.primaryType),
    statusLabel: getAdminAcquisitionStatusLabel(status),
    status,
    cityLabel: geo.cityName,
    districtLabel: geo.districtName,
    address: institution.location.address,
    phone: institution.contact.phone ?? "",
    email: institution.contact.email ?? "",
    websiteUrl: institution.socialLinks.websiteUrl ?? "",
    shortDescription: institution.shortDescription,
    longDescription: institution.longDescription ?? "",
    programsSummary: institution.programsSummary ?? "",
    qualityScore: row.quality.score,
    qualityGrade: row.quality.grade,
    qualityLevelLabel: getAdminAcquisitionQualityLevelLabel(row.quality.qualityLevel),
    missingFields: row.quality.missingFields,
    qualityIssueMessages: row.quality.qualityIssues.map((issue) => issue.message),
    duplicateWarnings: row.duplicateNames.map((name) => `Aynı ad ve şehirde başka kayıt: ${name}`),
    suggestedActions: row.suggestedActions,
    publishReady: row.publishValidation.ok,
    publishBlockers: row.publishValidation.errors,
    canPublish: status !== "published" && row.publishValidation.ok,
    canReturnToDraft: status !== "draft",
    canReject: status !== "archived",
    profileHref: `/institutions/${institution.slug}`,
    googlePlaceName: institution.googleBusiness?.placeName ?? "",
    googleFormattedAddress: institution.googleBusiness?.formattedAddress ?? "",
    googleSyncStatusLabel: googleSyncStatusLabel(institution.googleBusiness?.syncStatus),
    googleMatchMethodLabel: googleMatchMethodLabel(institution.googleBusiness?.matchMethod),
    googleConfidenceLabel:
      institution.googleBusiness?.confidenceScore !== undefined
        ? `%${Math.round(institution.googleBusiness.confidenceScore * 100)}`
        : "",
    googleLastError: institution.googleBusiness?.lastError ?? "",
    googleMapsUrl: institution.googleBusiness?.mapsUrl ?? institution.location.googleMapsUrl ?? "",
  });
}

function googleSyncStatusLabel(status: string | undefined): string {
  switch (status) {
    case GoogleBusinessSyncStatus.Synced:
      return "Eşitlendi";
    case GoogleBusinessSyncStatus.Stale:
      return "Eski";
    case GoogleBusinessSyncStatus.Failed:
      return "Başarısız";
    case GoogleBusinessSyncStatus.NotFound:
      return "Bulunamadı";
    case GoogleBusinessSyncStatus.ManualRequired:
      return "Manuel gerekli";
    case GoogleBusinessSyncStatus.Pending:
      return "Beklemede";
    case GoogleBusinessSyncStatus.NeverSynced:
      return "Hiç eşitlenmedi";
    default:
      return status ? String(status) : "Hiç eşitlenmedi";
  }
}

function googleMatchMethodLabel(method: string | undefined): string {
  switch (method) {
    case GoogleBusinessMatchMethod.TextSearch:
      return "Arama";
    case GoogleBusinessMatchMethod.Rematch:
      return "Yeniden arama";
    case GoogleBusinessMatchMethod.Manual:
      return "Manuel";
    case GoogleBusinessMatchMethod.Unmatched:
      return "Eşleşmedi";
    default:
      return method ? String(method) : "—";
  }
}
