export type AdminReviewQueueId = "draft" | "needs_review" | "ready" | "published" | "rejected";

export type AdminReviewSort = "newest" | "highest" | "lowest";

export type AdminReviewFilterOption = Readonly<{
  readonly value: string;
  readonly label: string;
}>;

export type AdminReviewQueueTab = Readonly<{
  readonly id: AdminReviewQueueId;
  readonly label: string;
  readonly count: number;
  readonly href: string;
}>;

export type AdminReviewRowView = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly typeLabel: string;
  readonly cityLabel: string;
  readonly districtLabel: string;
  readonly statusLabel: string;
  readonly createdAtLabel: string;
  readonly qualityScore: number;
  readonly qualityGrade: string;
  readonly qualityLevelLabel: string;
  readonly missingFieldCount: number;
  readonly isDuplicateCandidate: boolean;
  readonly publishReady: boolean;
  /** Opens this row in the review panel (preserves filters). */
  readonly reviewHref: string;
}>;

export type AdminReviewPanelView = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly typeLabel: string;
  readonly statusLabel: string;
  readonly status: string;
  readonly cityLabel: string;
  readonly districtLabel: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly websiteUrl: string;
  readonly shortDescription: string;
  readonly longDescription: string;
  readonly programsSummary: string;
  readonly qualityScore: number;
  readonly qualityGrade: string;
  readonly qualityLevelLabel: string;
  readonly missingFields: readonly string[];
  readonly qualityIssueMessages: readonly string[];
  readonly duplicateWarnings: readonly string[];
  readonly suggestedActions: readonly string[];
  readonly publishReady: boolean;
  readonly publishBlockers: readonly string[];
  readonly canPublish: boolean;
  readonly canReturnToDraft: boolean;
  readonly canReject: boolean;
  readonly profileHref: string;
}>;

export type AdminReviewFiltersView = Readonly<{
  readonly cityId: string;
  readonly districtId: string;
  readonly primaryType: string;
  readonly qualityBand: string;
  readonly status: string;
}>;

export type AdminReviewQueueViewData = Readonly<{
  readonly title: string;
  readonly subtitle: string;
  readonly generatedAtLabel: string;
  readonly activeQueue: AdminReviewQueueId;
  readonly activeSort: AdminReviewSort;
  readonly queueTabs: readonly AdminReviewQueueTab[];
  readonly searchQuery: string;
  readonly filters: AdminReviewFiltersView;
  readonly sortOptions: readonly AdminReviewFilterOption[];
  readonly cityOptions: readonly AdminReviewFilterOption[];
  readonly districtOptions: readonly AdminReviewFilterOption[];
  readonly typeOptions: readonly AdminReviewFilterOption[];
  readonly qualityBandOptions: readonly AdminReviewFilterOption[];
  readonly statusOptions: readonly AdminReviewFilterOption[];
  readonly rows: readonly AdminReviewRowView[];
  readonly selected: AdminReviewPanelView | null;
  /** Feedback from the last review action (e.g. publish blockers). */
  readonly notice: string;
  readonly noticeTone: "info" | "error" | "";
  /** Current URL query string (used to return after actions). */
  readonly returnTo: string;
}>;

const QUEUE_LABELS: Readonly<Record<AdminReviewQueueId, string>> = Object.freeze({
  draft: "Taslak kuyruğu",
  needs_review: "İnceleme bekleyen",
  ready: "Yayına hazır",
  published: "Yayında",
  rejected: "Reddedilen",
});

export const ADMIN_REVIEW_QUEUE_IDS: readonly AdminReviewQueueId[] = Object.freeze([
  "draft",
  "needs_review",
  "ready",
  "published",
  "rejected",
]);

export function getAdminReviewQueueLabel(queue: AdminReviewQueueId): string {
  return QUEUE_LABELS[queue];
}

export const ADMIN_REVIEW_SORT_OPTIONS: readonly AdminReviewFilterOption[] = Object.freeze([
  { value: "newest", label: "En yeni" },
  { value: "highest", label: "En yüksek kalite" },
  { value: "lowest", label: "En düşük kalite" },
]);

export const ADMIN_REVIEW_QUALITY_BAND_OPTIONS: readonly AdminReviewFilterOption[] = Object.freeze([
  { value: "low", label: "Düşük (0–39)" },
  { value: "medium", label: "Orta (40–69)" },
  { value: "healthy", label: "İyi (70–84)" },
  { value: "excellent", label: "Mükemmel (85+)" },
]);

export type BuildAdminReviewHrefInput = {
  queue: AdminReviewQueueId;
  sort: AdminReviewSort;
  filters: AdminReviewFiltersView;
  searchQuery: string;
  selectedId?: string;
};

export function buildAdminReviewHref(input: BuildAdminReviewHrefInput): string {
  const params = new URLSearchParams();
  if (input.queue !== "draft") params.set("queue", input.queue);
  if (input.sort !== "newest") params.set("sort", input.sort);
  if (input.filters.cityId) params.set("cityId", input.filters.cityId);
  if (input.filters.districtId) params.set("districtId", input.filters.districtId);
  if (input.filters.primaryType) params.set("primaryType", input.filters.primaryType);
  if (input.filters.qualityBand) params.set("qualityBand", input.filters.qualityBand);
  if (input.filters.status) params.set("status", input.filters.status);
  if (input.searchQuery) params.set("q", input.searchQuery);
  if (input.selectedId) params.set("selected", input.selectedId);
  const qs = params.toString();
  return qs ? `/admin/review?${qs}` : "/admin/review";
}

export type BuildAdminReviewQueueTabsInput = {
  activeQueue: AdminReviewQueueId;
  queueCounts: Readonly<Record<AdminReviewQueueId, number>>;
  sort: AdminReviewSort;
  filters: AdminReviewFiltersView;
  searchQuery: string;
};

export function buildAdminReviewQueueTabs(
  input: BuildAdminReviewQueueTabsInput,
): readonly AdminReviewQueueTab[] {
  return Object.freeze(
    ADMIN_REVIEW_QUEUE_IDS.map((id) =>
      Object.freeze({
        id,
        label: QUEUE_LABELS[id],
        count: input.queueCounts[id] ?? 0,
        href: buildAdminReviewHref({
          queue: id,
          sort: input.sort,
          filters: input.filters,
          searchQuery: input.searchQuery,
        }),
      }),
    ),
  );
}
