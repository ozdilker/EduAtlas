import {
  foldTurkishText,
  type Institution,
  InstitutionStatus,
  type InstitutionType,
  institutionIdAsString,
  validateInstitutionForPublish,
} from "@eduatlas/domain";
import { calculateInstitutionQuality } from "../institution-quality/calculate-institution-quality";
import { createInstitutionFilters } from "../institutions/institution-filters";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type {
  InstitutionReviewQueue,
  ReviewCountBucket,
  ReviewQualityBand,
  ReviewQueueId,
  ReviewQueueRow,
  ReviewSort,
} from "./institution-review-model";

export type GetInstitutionReviewQueueInput = {
  queue?: ReviewQueueId;
  sort?: ReviewSort;
  cityId?: string;
  districtId?: string;
  primaryType?: InstitutionType;
  qualityBand?: ReviewQualityBand;
  status?: InstitutionStatus;
  query?: string;
  /** Institution id opened in the review panel. */
  selectedId?: string;
  pageSize?: number;
  now?: string;
};

export type GetInstitutionReviewQueueDependencies = {
  institutionRepository: InstitutionRepository;
  resolveCityLabel?: (cityId: string) => string;
  resolveDistrictLabel?: (cityId: string, districtId: string) => string;
};

const DEFAULT_PAGE_SIZE = 500;

export function reviewQualityBand(score: number): ReviewQualityBand {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  if (score < 85) return "healthy";
  return "excellent";
}

function isInReviewQueue(row: ReviewQueueRow, queue: ReviewQueueId): boolean {
  const status = row.institution.status;
  switch (queue) {
    case "draft":
      return status === InstitutionStatus.Draft;
    case "needs_review":
      return status === InstitutionStatus.PendingReview;
    case "ready":
      return (
        (status === InstitutionStatus.Draft || status === InstitutionStatus.PendingReview) &&
        row.publishValidation.ok
      );
    case "published":
      return status === InstitutionStatus.Published;
    case "rejected":
      return status === InstitutionStatus.Archived;
    default:
      return true;
  }
}

function duplicateGroupKey(institution: Institution): string {
  const nameKey = foldTurkishText(institution.name)
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
  return `${nameKey}::${institution.location.cityId}`;
}

/**
 * Rule-based reviewer suggestions (no AI, no automation — advice only).
 */
function buildSuggestedActions(row: {
  institution: Institution;
  publishOk: boolean;
  publishErrors: readonly string[];
  qualityScore: number;
  missingFields: readonly string[];
  duplicateNames: readonly string[];
}): readonly string[] {
  const suggestions: string[] = [];
  const status = row.institution.status;

  if (row.duplicateNames.length > 0) {
    suggestions.push(
      `Olası yinelenme: ${row.duplicateNames.slice(0, 2).join(", ")} — birleştirme değerlendirin.`,
    );
  }

  if (status === InstitutionStatus.Published) {
    if (row.qualityScore < 40) {
      suggestions.push("Yayında ancak kalite kritik — taslağa döndürmeyi değerlendirin.");
    }
  } else if (status !== InstitutionStatus.Archived) {
    if (row.publishOk) {
      suggestions.push(
        row.qualityScore >= 70
          ? "Yayın koşulları sağlanıyor — yayınlanabilir."
          : "Yayınlanabilir; ancak önce kalite eksiklerini tamamlamak önerilir.",
      );
    } else {
      suggestions.push(`Yayın engelleri: ${row.publishErrors.join("; ")}.`);
    }
    if (row.missingFields.length > 0) {
      suggestions.push(`Eksik alanlar: ${row.missingFields.slice(0, 5).join(", ")}.`);
    }
  } else {
    suggestions.push("Reddedilmiş kayıt — düzeltme sonrası taslağa döndürülebilir.");
  }

  return Object.freeze(suggestions);
}

function sortRows(rows: ReviewQueueRow[], sort: ReviewSort): ReviewQueueRow[] {
  const copy = [...rows];
  switch (sort) {
    case "highest":
      return copy.sort((left, right) => right.quality.score - left.quality.score);
    case "lowest":
      return copy.sort((left, right) => left.quality.score - right.quality.score);
    default:
      return copy.sort((left, right) =>
        right.institution.createdAt.localeCompare(left.institution.createdAt),
      );
  }
}

function toBuckets(counts: Map<string, { label: string; count: number }>): ReviewCountBucket[] {
  return [...counts.entries()]
    .map(([id, value]) => Object.freeze({ id, label: value.label, count: value.count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

/**
 * Repository-backed Institution Review Queue.
 * Every imported institution passes through here before publication —
 * purely human-driven; this service only reads and aggregates.
 */
export async function getInstitutionReviewQueue(
  input: GetInstitutionReviewQueueInput,
  deps: GetInstitutionReviewQueueDependencies,
): Promise<InstitutionReviewQueue> {
  const queue: ReviewQueueId = input.queue ?? "draft";
  const sort: ReviewSort = input.sort ?? "newest";
  const now = input.now ?? new Date().toISOString();

  const filters = createInstitutionFilters({
    cityId: input.cityId,
    districtId: input.districtId,
    primaryType: input.primaryType,
    status: input.status,
    query: input.query,
  });

  const page = await deps.institutionRepository.list({
    filters,
    page: 1,
    pageSize: input.pageSize ?? DEFAULT_PAGE_SIZE,
  });

  const resolveCity = deps.resolveCityLabel ?? ((cityId: string) => cityId);
  const resolveDistrict =
    deps.resolveDistrictLabel ??
    ((cityId: string, districtId: string) => `${cityId}/${districtId}`);

  const groups = new Map<string, Institution[]>();
  for (const institution of page.items) {
    const key = duplicateGroupKey(institution);
    const members = groups.get(key) ?? [];
    members.push(institution);
    groups.set(key, members);
  }

  const allRows: ReviewQueueRow[] = page.items.map((institution) => {
    const { quality, recommendations } = calculateInstitutionQuality({ institution, now });
    const publishValidation = validateInstitutionForPublish(institution);
    const members = groups.get(duplicateGroupKey(institution)) ?? [];
    const duplicateNames = Object.freeze(
      members
        .filter(
          (member) => institutionIdAsString(member.id) !== institutionIdAsString(institution.id),
        )
        .map((member) => member.name),
    );

    return Object.freeze({
      institution,
      quality,
      recommendations,
      publishValidation,
      isDuplicateCandidate: duplicateNames.length > 0,
      duplicateNames,
      suggestedActions: buildSuggestedActions({
        institution,
        publishOk: publishValidation.ok,
        publishErrors: publishValidation.errors,
        qualityScore: quality.score,
        missingFields: quality.missingFields,
        duplicateNames,
      }),
    });
  });

  const bandFiltered = allRows.filter(
    (row) => !input.qualityBand || reviewQualityBand(row.quality.score) === input.qualityBand,
  );

  const queueCounts = Object.freeze({
    draft: bandFiltered.filter((row) => isInReviewQueue(row, "draft")).length,
    needs_review: bandFiltered.filter((row) => isInReviewQueue(row, "needs_review")).length,
    ready: bandFiltered.filter((row) => isInReviewQueue(row, "ready")).length,
    published: bandFiltered.filter((row) => isInReviewQueue(row, "published")).length,
    rejected: bandFiltered.filter((row) => isInReviewQueue(row, "rejected")).length,
  });

  const rows = Object.freeze(
    sortRows(
      bandFiltered.filter((row) => isInReviewQueue(row, queue)),
      sort,
    ),
  ) as readonly ReviewQueueRow[];

  const selected = input.selectedId
    ? (allRows.find((row) => institutionIdAsString(row.institution.id) === input.selectedId) ??
      null)
    : null;

  const cityCounts = new Map<string, { label: string; count: number }>();
  const districtCounts = new Map<string, { label: string; count: number }>();
  for (const institution of page.items) {
    const cityId = institution.location.cityId;
    const districtId = institution.location.districtId;
    const cityEntry = cityCounts.get(cityId) ?? { label: resolveCity(cityId), count: 0 };
    cityEntry.count += 1;
    cityCounts.set(cityId, cityEntry);
    const districtKey = `${cityId}::${districtId}`;
    const districtEntry = districtCounts.get(districtKey) ?? {
      label: resolveDistrict(cityId, districtId),
      count: 0,
    };
    districtEntry.count += 1;
    districtCounts.set(districtKey, districtEntry);
  }

  return Object.freeze({
    generatedAt: now,
    queue,
    sort,
    filters: Object.freeze({
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.districtId ? { districtId: filters.districtId } : {}),
      ...(filters.primaryType ? { primaryType: filters.primaryType } : {}),
      ...(input.qualityBand ? { qualityBand: input.qualityBand } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.query ? { query: filters.query } : {}),
    }),
    queueCounts,
    rows,
    selected,
    availableCities: Object.freeze(toBuckets(cityCounts)),
    availableDistricts: Object.freeze(toBuckets(districtCounts)),
  });
}
