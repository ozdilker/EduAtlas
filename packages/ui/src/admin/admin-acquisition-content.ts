export type AdminAcquisitionQueueId =
  | "import"
  | "pending"
  | "verified"
  | "claimed"
  | "duplicates"
  | "all";

export type AdminNavItemId =
  | "overview"
  | "acquisition"
  | "home"
  | "import"
  | "operations"
  | "review";

export type AdminAcquisitionQueueTab = Readonly<{
  readonly id: AdminAcquisitionQueueId;
  readonly label: string;
  readonly count: number;
  readonly href: string;
}>;

export type AdminAcquisitionFilterOption = Readonly<{
  readonly value: string;
  readonly label: string;
}>;

export type AdminQualityIndicatorView = Readonly<{
  readonly missingPhone: boolean;
  readonly missingWebsite: boolean;
  readonly missingDescription: boolean;
  readonly missingCoordinates: boolean;
  readonly missingCategories: boolean;
  readonly missingCount: number;
  readonly labels: readonly string[];
}>;

export type AdminAcquisitionPendingClaimView = Readonly<{
  readonly claimRequestId: string;
  readonly applicantName: string;
  readonly applicantEmail: string;
}>;

export type AdminAcquisitionRowView = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly typeLabel: string;
  readonly cityLabel: string;
  readonly districtLabel: string;
  readonly statusLabel: string;
  readonly verificationLabel: string;
  readonly ownershipLabel: string;
  readonly qualityScore: number;
  readonly qualityGrade: string;
  readonly qualityLevelLabel: string;
  readonly qualityBandLabel: string;
  readonly missingFields: readonly string[];
  readonly qualityIssueMessages: readonly string[];
  readonly recommendationTitles: readonly string[];
  readonly indicators: AdminQualityIndicatorView;
  readonly isDuplicateCandidate: boolean;
  readonly profileHref: string;
  /** Latest pending claim for this institution, if any. */
  readonly pendingClaim: AdminAcquisitionPendingClaimView | null;
}>;

export type AdminCountBucketView = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly count: number;
}>;

export type AdminAcquisitionQualitySort = "highest" | "lowest" | "missing_fields";

export type AdminAcquisitionPagination = Readonly<{
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly from: number;
  readonly to: number;
  readonly pageNumbers: readonly number[];
}>;

export type AdminAcquisitionDashboardViewData = Readonly<{
  readonly title: string;
  readonly subtitle: string;
  readonly generatedAtLabel: string;
  readonly activeQueue: AdminAcquisitionQueueId;
  readonly activeSort: AdminAcquisitionQualitySort;
  readonly queueTabs: readonly AdminAcquisitionQueueTab[];
  readonly sortOptions: readonly AdminAcquisitionFilterOption[];
  readonly searchQuery: string;
  readonly filters: Readonly<{
    readonly cityId: string;
    readonly districtId: string;
    readonly primaryType: string;
    readonly verification: string;
    readonly ownership: string;
    readonly status: string;
  }>;
  readonly cityOptions: readonly AdminAcquisitionFilterOption[];
  readonly districtOptions: readonly AdminAcquisitionFilterOption[];
  readonly typeOptions: readonly AdminAcquisitionFilterOption[];
  readonly verificationOptions: readonly AdminAcquisitionFilterOption[];
  readonly ownershipOptions: readonly AdminAcquisitionFilterOption[];
  readonly statusOptions: readonly AdminAcquisitionFilterOption[];
  readonly statistics: Readonly<{
    readonly totalInstitutions: number;
    readonly claimRatePercent: number;
    readonly verificationRatePercent: number;
    readonly averageQualityScore: number;
    readonly byCity: readonly AdminCountBucketView[];
    readonly byType: readonly AdminCountBucketView[];
    readonly qualityDistribution: Readonly<{
      readonly low: number;
      readonly medium: number;
      readonly healthy: number;
      readonly excellent: number;
      readonly byGrade: Readonly<Record<string, number>>;
      readonly byLevel: Readonly<Record<string, number>>;
    }>;
    readonly progressPercent: number;
  }>;
  /** Institutions matching current queue + filters (full set, not page slice). */
  readonly filteredCount: number;
  readonly pagination: AdminAcquisitionPagination;
  readonly rows: readonly AdminAcquisitionRowView[];
  readonly duplicateCandidates: readonly AdminCountBucketView[];
  readonly bulkActionsNote: string;
}>;

export const ADMIN_ACQUISITION_PAGE_SIZE = 50;

const QUEUE_LABELS: Readonly<Record<AdminAcquisitionQueueId, string>> = Object.freeze({
  all: "Tümü",
  import: "İçe aktarım kuyruğu",
  pending: "Bekleyen kurumlar",
  verified: "Doğrulanmış kurumlar",
  claimed: "Sahiplenilmiş kurumlar",
  duplicates: "Yinelenen adaylar",
});

export const ADMIN_ACQUISITION_TYPE_OPTIONS: readonly AdminAcquisitionFilterOption[] =
  Object.freeze([
    { value: "private_school", label: "Özel Okul" },
    { value: "dershane", label: "Dershane" },
    { value: "etut_merkezi", label: "Etüt Merkezi" },
    { value: "language_school", label: "Dil Okulu" },
    { value: "kindergarten", label: "Anaokulu" },
    { value: "preschool", label: "Kreş" },
  ]);

export const ADMIN_ACQUISITION_VERIFICATION_OPTIONS: readonly AdminAcquisitionFilterOption[] =
  Object.freeze([
    { value: "unclaimed", label: "Sahipsiz" },
    { value: "pending", label: "Talep incelemede" },
    { value: "verified", label: "Doğrulanmış" },
    { value: "revoked", label: "İptal" },
  ]);

export const ADMIN_ACQUISITION_OWNERSHIP_OPTIONS: readonly AdminAcquisitionFilterOption[] =
  Object.freeze([
    { value: "unclaimed", label: "Sahipsiz" },
    { value: "claimed", label: "Sahiplenilmiş / talepte" },
  ]);

export const ADMIN_ACQUISITION_STATUS_OPTIONS: readonly AdminAcquisitionFilterOption[] =
  Object.freeze([
    { value: "draft", label: "Taslak" },
    { value: "pending_review", label: "İncelemede" },
    { value: "published", label: "Yayında" },
    { value: "archived", label: "Arşiv" },
  ]);

export const ADMIN_ACQUISITION_SORT_OPTIONS: readonly AdminAcquisitionFilterOption[] =
  Object.freeze([
    { value: "highest", label: "En yüksek kalite" },
    { value: "lowest", label: "En düşük kalite" },
    { value: "missing_fields", label: "Eksik alan sayısı" },
  ]);

export function getAdminAcquisitionQualityLevelLabel(level: string): string {
  switch (level) {
    case "critical":
      return "Kritik";
    case "needs_work":
      return "Geliştirilmeli";
    case "healthy":
      return "Sağlıklı";
    case "excellent":
      return "Mükemmel";
    default:
      return level;
  }
}

export function getAdminAcquisitionQueueLabel(queue: AdminAcquisitionQueueId): string {
  return QUEUE_LABELS[queue];
}

export function getAdminAcquisitionQualityBandLabel(score: number): string {
  if (score < 40) return "Düşük";
  if (score < 70) return "Orta";
  if (score < 85) return "İyi";
  return "Mükemmel";
}

export function getAdminAcquisitionStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Taslak";
    case "pending_review":
      return "İncelemede";
    case "published":
      return "Yayında";
    case "archived":
      return "Arşiv";
    case "deleted":
      return "Silindi";
    default:
      return status;
  }
}

export function getAdminAcquisitionVerificationLabel(verification: string): string {
  switch (verification) {
    case "unclaimed":
      return "Sahipsiz";
    case "pending":
      return "Talep incelemede";
    case "verified":
      return "Doğrulanmış sahip";
    case "revoked":
      return "İptal";
    default:
      return verification;
  }
}

export function getAdminAcquisitionOwnershipLabel(verification: string): string {
  if (verification === "verified" || verification === "pending") {
    return "Sahiplenilmiş / talepte";
  }
  if (verification === "revoked") {
    return "İptal edilmiş";
  }
  return "Sahipsiz";
}

export function buildAdminQualityIndicatorLabels(indicators: {
  missingPhone: boolean;
  missingWebsite: boolean;
  missingDescription: boolean;
  missingCoordinates: boolean;
  missingCategories: boolean;
}): readonly string[] {
  const labels: string[] = [];
  if (indicators.missingPhone) labels.push("Telefon yok");
  if (indicators.missingWebsite) labels.push("Web sitesi yok");
  if (indicators.missingDescription) labels.push("Açıklama yok");
  if (indicators.missingCoordinates) labels.push("Koordinat yok");
  if (indicators.missingCategories) labels.push("Kategori/program yok");
  return Object.freeze(labels);
}

export function buildAdminAcquisitionQueueHref(
  queue: AdminAcquisitionQueueId,
  filters: AdminAcquisitionDashboardViewData["filters"],
  searchQuery: string,
  sort: AdminAcquisitionQualitySort = "highest",
  page = 1,
): string {
  const params = new URLSearchParams();
  if (queue !== "all") params.set("queue", queue);
  if (sort !== "highest") params.set("sort", sort);
  if (filters.cityId) params.set("cityId", filters.cityId);
  if (filters.districtId) params.set("districtId", filters.districtId);
  if (filters.primaryType) params.set("primaryType", filters.primaryType);
  if (filters.verification) params.set("verification", filters.verification);
  if (filters.ownership) params.set("ownership", filters.ownership);
  if (filters.status) params.set("status", filters.status);
  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/acquisition?${qs}` : "/admin/acquisition";
}

/**
 * Builds a compact page-number window around the current page.
 */
export function buildAdminAcquisitionPageNumbers(
  page: number,
  totalPages: number,
  windowSize = 5,
): readonly number[] {
  if (totalPages <= 1) {
    return Object.freeze([1]);
  }
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  return Object.freeze(Array.from({ length: end - start + 1 }, (_, index) => start + index));
}

export type BuildAdminAcquisitionQueueTabsInput = {
  activeQueue: AdminAcquisitionQueueId;
  queueCounts: Readonly<Record<AdminAcquisitionQueueId, number>>;
  filters: AdminAcquisitionDashboardViewData["filters"];
  searchQuery: string;
  sort?: AdminAcquisitionQualitySort;
};

export function buildAdminAcquisitionQueueTabs(
  input: BuildAdminAcquisitionQueueTabsInput,
): readonly AdminAcquisitionQueueTab[] {
  return Object.freeze(
    (["all", "import", "pending", "verified", "claimed", "duplicates"] as const).map((id) =>
      Object.freeze({
        id,
        label: QUEUE_LABELS[id],
        count: input.queueCounts[id] ?? 0,
        href: buildAdminAcquisitionQueueHref(
          id,
          input.filters,
          input.searchQuery,
          input.sort ?? "highest",
        ),
      }),
    ),
  );
}
