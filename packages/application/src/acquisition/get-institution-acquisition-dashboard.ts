import {
  foldTurkishText,
  type Institution,
  InstitutionStatus,
  type InstitutionType,
  InstitutionVerification,
  institutionIdAsString,
  QualityGrade,
  QualityLevel,
} from "@eduatlas/domain";
import { calculateInstitutionQuality } from "../institution-quality/calculate-institution-quality";
import { createInstitutionFilters } from "../institutions/institution-filters";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type {
  AcquisitionCountBucket,
  AcquisitionDuplicateCandidate,
  AcquisitionInstitutionRow,
  AcquisitionQualitySort,
  AcquisitionQueueId,
  AcquisitionStatistics,
  InstitutionAcquisitionDashboard,
  InstitutionQualityIndicators,
} from "./institution-acquisition-model";

export type AcquisitionOwnershipFilter = "unclaimed" | "claimed";

export type GetInstitutionAcquisitionDashboardInput = {
  queue?: AcquisitionQueueId;
  cityId?: string;
  districtId?: string;
  primaryType?: InstitutionType;
  status?: InstitutionStatus;
  verification?: InstitutionVerification;
  /** Soft ownership filter orthogonal to precise verification enum (ops UI). */
  ownership?: AcquisitionOwnershipFilter;
  query?: string;
  sort?: AcquisitionQualitySort;
  /** Caps list load for national-scale safety; repository still used as source of truth. */
  pageSize?: number;
  now?: string;
};

export type GetInstitutionAcquisitionDashboardDependencies = {
  institutionRepository: InstitutionRepository;
  resolveCityLabel?: (cityId: string) => string;
  resolveDistrictLabel?: (cityId: string, districtId: string) => string;
  resolveTypeLabel?: (type: InstitutionType) => string;
};

const DEFAULT_PAGE_SIZE = 500;

/**
 * Builds quality gap flags for acquisition moderation (presentation helpers).
 */
export function buildInstitutionQualityIndicators(
  institution: Institution,
): InstitutionQualityIndicators {
  const missingPhone = !institution.contact.phone?.trim();
  const missingWebsite = !institution.socialLinks.websiteUrl?.trim();
  const missingDescription = !institution.shortDescription?.trim();
  const missingCoordinates =
    institution.location.latitude === undefined || institution.location.longitude === undefined;
  const missingCategories = !institution.programsSummary?.trim();
  const flags = [
    missingPhone,
    missingWebsite,
    missingDescription,
    missingCoordinates,
    missingCategories,
  ];

  return Object.freeze({
    missingPhone,
    missingWebsite,
    missingDescription,
    missingCoordinates,
    missingCategories,
    missingCount: flags.filter(Boolean).length,
  });
}

function normalizeNameKey(name: string): string {
  return foldTurkishText(name)
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

function duplicateGroupKey(institution: Institution): string {
  return `${normalizeNameKey(institution.name)}::${institution.location.cityId}`;
}

function isInQueue(institution: Institution, queue: AcquisitionQueueId): boolean {
  switch (queue) {
    case "import":
      return institution.status === InstitutionStatus.Draft;
    case "pending":
      return (
        institution.status === InstitutionStatus.PendingReview ||
        institution.verification === InstitutionVerification.Pending
      );
    case "verified":
      return institution.verification === InstitutionVerification.Verified;
    case "claimed":
      return (
        institution.verification === InstitutionVerification.Verified ||
        institution.verification === InstitutionVerification.Pending
      );
    case "duplicates":
      return false;
    case "all":
      return true;
    default:
      return true;
  }
}

function qualityBand(score: number): "low" | "medium" | "healthy" | "excellent" {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  if (score < 85) return "healthy";
  return "excellent";
}

function emptyGradeCounts(): Record<QualityGrade, number> {
  return {
    [QualityGrade.A]: 0,
    [QualityGrade.B]: 0,
    [QualityGrade.C]: 0,
    [QualityGrade.D]: 0,
    [QualityGrade.E]: 0,
    [QualityGrade.F]: 0,
  };
}

function emptyLevelCounts(): Record<QualityLevel, number> {
  return {
    [QualityLevel.Critical]: 0,
    [QualityLevel.NeedsWork]: 0,
    [QualityLevel.Healthy]: 0,
    [QualityLevel.Excellent]: 0,
  };
}

function toBuckets(
  counts: Map<string, { label: string; count: number }>,
): readonly AcquisitionCountBucket[] {
  return Object.freeze(
    [...counts.entries()]
      .map(([id, value]) =>
        Object.freeze({
          id,
          label: value.label,
          count: value.count,
        }),
      )
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
  );
}

function sortAcquisitionRows(
  rows: AcquisitionInstitutionRow[],
  sort: AcquisitionQualitySort,
): AcquisitionInstitutionRow[] {
  const copy = [...rows];
  switch (sort) {
    case "lowest":
      return copy.sort((left, right) => left.quality.score - right.quality.score);
    case "missing_fields":
      return copy.sort(
        (left, right) =>
          right.quality.missingFields.length - left.quality.missingFields.length ||
          left.quality.score - right.quality.score,
      );
    default:
      return copy.sort((left, right) => right.quality.score - left.quality.score);
  }
}

/**
 * Repository-backed Institution Acquisition Dashboard aggregate.
 * Quality scores come from calculateInstitutionQuality (internal engine).
 */
export async function getInstitutionAcquisitionDashboard(
  input: GetInstitutionAcquisitionDashboardInput,
  deps: GetInstitutionAcquisitionDashboardDependencies,
): Promise<InstitutionAcquisitionDashboard> {
  const queue: AcquisitionQueueId = input.queue ?? "all";
  const sort: AcquisitionQualitySort = input.sort ?? "highest";
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  const now = input.now ?? new Date().toISOString();
  const filters = createInstitutionFilters({
    cityId: input.cityId,
    districtId: input.districtId,
    primaryType: input.primaryType,
    status: input.status,
    verification: input.verification,
    query: input.query,
  });

  const page = await deps.institutionRepository.list({
    filters,
    page: 1,
    pageSize,
  });

  const ownershipFiltered = page.items.filter((institution) => {
    if (!input.ownership) {
      return true;
    }
    const claimed =
      institution.verification === InstitutionVerification.Verified ||
      institution.verification === InstitutionVerification.Pending;
    return input.ownership === "claimed" ? claimed : !claimed;
  });

  const resolveCity = deps.resolveCityLabel ?? ((cityId: string) => cityId);
  const resolveDistrict =
    deps.resolveDistrictLabel ??
    ((cityId: string, districtId: string) => `${cityId}/${districtId}`);
  const resolveType = deps.resolveTypeLabel ?? ((type: InstitutionType) => type);

  const groupCounts = new Map<string, Institution[]>();
  for (const institution of ownershipFiltered) {
    const key = duplicateGroupKey(institution);
    const existing = groupCounts.get(key) ?? [];
    existing.push(institution);
    groupCounts.set(key, existing);
  }

  const duplicateCandidates = Object.freeze(
    [...groupCounts.entries()]
      .filter(([, institutions]) => institutions.length > 1)
      .map(([groupKey, institutions]) => {
        const sample = institutions[0];
        if (!sample) {
          throw new Error("Unexpected empty duplicate group.");
        }
        return Object.freeze({
          groupKey,
          institutionIds: Object.freeze(institutions.map((item) => institutionIdAsString(item.id))),
          label: `${sample.name} · ${resolveCity(sample.location.cityId)}`,
          count: institutions.length,
        });
      })
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
  ) as readonly AcquisitionDuplicateCandidate[];

  const duplicateIdSet = new Set(duplicateCandidates.flatMap((item) => item.institutionIds));

  const unsortedRows: AcquisitionInstitutionRow[] = ownershipFiltered
    .filter((institution) => {
      if (queue === "duplicates") {
        return duplicateIdSet.has(institutionIdAsString(institution.id));
      }
      return isInQueue(institution, queue);
    })
    .map((institution) => {
      const groupKey = duplicateGroupKey(institution);
      const isDuplicate = (groupCounts.get(groupKey)?.length ?? 0) > 1;
      const { quality, recommendations } = calculateInstitutionQuality({
        institution,
        now,
      });
      return Object.freeze({
        institution,
        qualityIndicators: buildInstitutionQualityIndicators(institution),
        quality,
        recommendations,
        ...(isDuplicate ? { duplicateGroupKey: groupKey } : {}),
      });
    });

  const rows = Object.freeze(
    sortAcquisitionRows(unsortedRows, sort),
  ) as readonly AcquisitionInstitutionRow[];

  const cityCounts = new Map<string, { label: string; count: number }>();
  const districtCounts = new Map<string, { label: string; count: number }>();
  const typeCounts = new Map<string, { label: string; count: number }>();
  const qualityDistribution = {
    low: 0,
    medium: 0,
    healthy: 0,
    excellent: 0,
    byGrade: emptyGradeCounts(),
    byLevel: emptyLevelCounts(),
    averageScore: 0,
  };
  let claimedCount = 0;
  let verifiedCount = 0;
  let scoreSum = 0;

  for (const institution of ownershipFiltered) {
    const cityId = institution.location.cityId;
    const districtId = institution.location.districtId;
    const cityEntry = cityCounts.get(cityId) ?? {
      label: resolveCity(cityId),
      count: 0,
    };
    cityEntry.count += 1;
    cityCounts.set(cityId, cityEntry);

    const districtKey = `${cityId}::${districtId}`;
    const districtEntry = districtCounts.get(districtKey) ?? {
      label: resolveDistrict(cityId, districtId),
      count: 0,
    };
    districtEntry.count += 1;
    districtCounts.set(districtKey, districtEntry);

    const typeEntry = typeCounts.get(institution.primaryType) ?? {
      label: resolveType(institution.primaryType),
      count: 0,
    };
    typeEntry.count += 1;
    typeCounts.set(institution.primaryType, typeEntry);

    const { quality } = calculateInstitutionQuality({ institution, now });
    qualityDistribution[qualityBand(quality.score)] += 1;
    qualityDistribution.byGrade[quality.grade] += 1;
    qualityDistribution.byLevel[quality.qualityLevel] += 1;
    scoreSum += quality.score;

    if (
      institution.verification === InstitutionVerification.Verified ||
      institution.verification === InstitutionVerification.Pending
    ) {
      claimedCount += 1;
    }
    if (institution.verification === InstitutionVerification.Verified) {
      verifiedCount += 1;
    }
  }

  const total = ownershipFiltered.length;
  qualityDistribution.averageScore = total === 0 ? 0 : Math.round(scoreSum / total);

  const queueCounts: AcquisitionStatistics["queueCounts"] = Object.freeze({
    import: ownershipFiltered.filter((item) => isInQueue(item, "import")).length,
    pending: ownershipFiltered.filter((item) => isInQueue(item, "pending")).length,
    verified: ownershipFiltered.filter((item) => isInQueue(item, "verified")).length,
    claimed: ownershipFiltered.filter((item) => isInQueue(item, "claimed")).length,
    duplicates: duplicateIdSet.size,
    all: total,
  });

  const statistics: AcquisitionStatistics = Object.freeze({
    totalInstitutions: total,
    byCity: toBuckets(cityCounts),
    byType: toBuckets(typeCounts),
    claimRatePercent: total === 0 ? 0 : Math.round((claimedCount / total) * 100),
    verificationRatePercent: total === 0 ? 0 : Math.round((verifiedCount / total) * 100),
    qualityDistribution: Object.freeze({
      ...qualityDistribution,
      byGrade: Object.freeze(qualityDistribution.byGrade),
      byLevel: Object.freeze(qualityDistribution.byLevel),
    }),
    queueCounts,
  });

  return Object.freeze({
    generatedAt: now,
    queue,
    sort,
    filters: Object.freeze({
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.districtId ? { districtId: filters.districtId } : {}),
      ...(filters.primaryType ? { primaryType: filters.primaryType } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.verification ? { verification: filters.verification } : {}),
      ...(input.ownership ? { ownership: input.ownership } : {}),
      ...(filters.query ? { query: filters.query } : {}),
    }),
    statistics,
    rows,
    duplicateCandidates,
    availableCities: toBuckets(cityCounts),
    availableDistricts: toBuckets(districtCounts),
  });
}
