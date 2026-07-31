import type {
  Institution,
  InstitutionPublishValidation,
  InstitutionQualityScore,
  OwnerRecommendation,
} from "@eduatlas/domain";

/**
 * Review queues (DATA-ACQUISITION: human review before publication).
 * - draft: imported/new institutions not yet reviewed
 * - needs_review: explicitly submitted for review
 * - ready: draft or pending rows that already pass the publish gates
 * - published: live institutions
 * - rejected: archived by a reviewer
 */
export type ReviewQueueId = "draft" | "needs_review" | "ready" | "published" | "rejected";

export const REVIEW_QUEUE_IDS: readonly ReviewQueueId[] = Object.freeze([
  "draft",
  "needs_review",
  "ready",
  "published",
  "rejected",
]);

export type ReviewSort = "newest" | "highest" | "lowest";

export type ReviewQualityBand = "low" | "medium" | "healthy" | "excellent";

/**
 * One institution awaiting (or past) review, with everything the
 * review panel needs: quality, publish gates, duplicates, suggestions.
 */
export type ReviewQueueRow = Readonly<{
  readonly institution: Institution;
  readonly quality: InstitutionQualityScore;
  readonly recommendations: readonly OwnerRecommendation[];
  readonly publishValidation: InstitutionPublishValidation;
  readonly isDuplicateCandidate: boolean;
  /** Names of other institutions in the same duplicate group. */
  readonly duplicateNames: readonly string[];
  /** Human suggestions derived from gates/quality/duplicates. No AI. */
  readonly suggestedActions: readonly string[];
}>;

export type ReviewCountBucket = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly count: number;
}>;

export type ReviewQueueFilters = Readonly<{
  readonly cityId?: string;
  readonly districtId?: string;
  readonly primaryType?: string;
  readonly qualityBand?: ReviewQualityBand;
  readonly status?: string;
  readonly query?: string;
}>;

export type InstitutionReviewQueue = Readonly<{
  readonly generatedAt: string;
  readonly queue: ReviewQueueId;
  readonly sort: ReviewSort;
  readonly filters: ReviewQueueFilters;
  readonly queueCounts: Readonly<Record<ReviewQueueId, number>>;
  readonly rows: readonly ReviewQueueRow[];
  /** Row opened in the review panel, or null. */
  readonly selected: ReviewQueueRow | null;
  readonly availableCities: readonly ReviewCountBucket[];
  readonly availableDistricts: readonly ReviewCountBucket[];
}>;
