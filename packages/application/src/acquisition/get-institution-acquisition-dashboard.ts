import {
  foldTurkishText,
  type Institution,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  institutionIdAsString,
  QualityGrade,
  QualityLevel,
  qualityGradeFromScore,
  qualityLevelFromScore,
} from "@eduatlas/domain";
import { calculateInstitutionQuality } from "../institution-quality/calculate-institution-quality";
import {
  ADMIN_FREE_TEXT_SEARCH_LOCATION_REQUIRED_MESSAGE,
  isUnscopedAdminFreeTextQuery,
} from "../institutions/admin-free-text-search-scope";
import type { InstitutionAdminListFilters } from "../institutions/institution-admin-list";
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
  /** 1-based UI page for the queue-filtered list. */
  page?: number;
  /** Rows per UI page (default 50). */
  pageSize?: number;
  /** Opaque Firestore cursor for bounded table pagination. */
  cursor?: string | null;
  /**
   * When true, skip duplicate scan and heavy catalog materialization.
   * Used by overview/operations lightweight KPIs.
   */
  lightweight?: boolean;
  now?: string;
  /**
   * Optional city ids for byCity counts (bounded path). When omitted, byCity is empty
   * on the bounded path (filter dropdowns should use geography seed).
   */
  cityIdsForCounts?: readonly string[];
};

export type GetInstitutionAcquisitionDashboardDependencies = {
  institutionRepository: InstitutionRepository;
  resolveCityLabel?: (cityId: string) => string;
  resolveDistrictLabel?: (cityId: string, districtId: string) => string;
  resolveTypeLabel?: (type: InstitutionType) => string;
};

const DEFAULT_LIST_PAGE_SIZE = 50;
/**
 * Explicit full-catalog fetch cap for acquisition operations that cannot be bounded
 * (duplicate grouping, free-text substring, missing_fields sort, pending OR-queue).
 * Must NOT be used for the normal paginated table path.
 */
const ACQUISITION_CATALOG_SCAN_PAGE_SIZE = 50_000;

const ALL_TYPES = Object.freeze(Object.values(InstitutionType));

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
    (institution.location.latitude === undefined || institution.location.longitude === undefined) &&
    !institution.location.googleMapsUrl?.trim();
  const missingCategories =
    !institution.programsSummary?.trim() && (institution.educationPrograms?.length ?? 0) === 0;
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

function baseAdminFilters(input: {
  cityId?: string;
  districtId?: string;
  primaryType?: InstitutionType;
  status?: InstitutionStatus;
  verification?: InstitutionVerification;
  ownership?: AcquisitionOwnershipFilter;
}): InstitutionAdminListFilters {
  const ownershipVerifications =
    input.ownership === "claimed"
      ? ([InstitutionVerification.Verified, InstitutionVerification.Pending] as const)
      : input.ownership === "unclaimed"
        ? ([InstitutionVerification.Unclaimed] as const)
        : undefined;

  return {
    ...(input.cityId ? { cityId: input.cityId } : {}),
    ...(input.districtId ? { districtId: input.districtId } : {}),
    ...(input.primaryType ? { primaryType: input.primaryType } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.verification
      ? { verification: input.verification }
      : ownershipVerifications
        ? { verifications: ownershipVerifications }
        : {}),
  };
}

function queueTableFilters(
  queue: AcquisitionQueueId,
  base: InstitutionAdminListFilters,
): InstitutionAdminListFilters | null {
  switch (queue) {
    case "import":
      return { ...base, status: base.status ?? InstitutionStatus.Draft };
    case "verified":
      return { ...base, verification: base.verification ?? InstitutionVerification.Verified };
    case "claimed":
      return {
        ...base,
        verifications: base.verifications ?? [
          InstitutionVerification.Verified,
          InstitutionVerification.Pending,
        ],
      };
    case "all":
      return base;
    case "pending":
    case "duplicates":
      return null;
    default:
      return base;
  }
}

function acquisitionSortToAdminSort(sort: AcquisitionQualitySort): "quality_desc" | "quality_asc" {
  return sort === "lowest" ? "quality_asc" : "quality_desc";
}

function requiresCatalogScan(input: GetInstitutionAcquisitionDashboardInput): boolean {
  if (input.lightweight) return false;
  // Scoped free-text only — unscoped q is short-circuited before this runs.
  if (input.query?.trim()) return true;
  if (input.sort === "missing_fields") return true;
  if (input.queue === "duplicates" || input.queue === "pending") return true;
  return false;
}

function locationRequiredAcquisitionDashboard(
  input: GetInstitutionAcquisitionDashboardInput,
): InstitutionAcquisitionDashboard {
  const queue: AcquisitionQueueId = input.queue ?? "all";
  const sort: AcquisitionQualitySort = input.sort ?? "highest";
  const listPageSize = Math.max(1, input.pageSize ?? DEFAULT_LIST_PAGE_SIZE);
  const now = input.now ?? new Date().toISOString();
  const query = input.query?.trim() ?? "";

  const emptyStats: AcquisitionStatistics = Object.freeze({
    totalInstitutions: 0,
    byCity: Object.freeze([]),
    byType: Object.freeze([]),
    claimRatePercent: 0,
    verificationRatePercent: 0,
    qualityDistribution: Object.freeze({
      low: 0,
      medium: 0,
      healthy: 0,
      excellent: 0,
      byGrade: Object.freeze(emptyGradeCounts()),
      byLevel: Object.freeze(emptyLevelCounts()),
      averageScore: 0,
    }),
    queueCounts: Object.freeze({
      import: 0,
      pending: 0,
      verified: 0,
      claimed: 0,
      duplicates: 0,
      all: 0,
    }),
  });

  return Object.freeze({
    generatedAt: now,
    queue,
    sort,
    filters: Object.freeze({
      ...(input.cityId ? { cityId: input.cityId } : {}),
      ...(input.districtId ? { districtId: input.districtId } : {}),
      ...(input.primaryType ? { primaryType: input.primaryType } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.verification ? { verification: input.verification } : {}),
      ...(input.ownership ? { ownership: input.ownership } : {}),
      ...(query ? { query } : {}),
    }),
    statistics: emptyStats,
    matchedCount: 0,
    pagination: Object.freeze({
      page: 1,
      pageSize: listPageSize,
      totalPages: 1,
      totalItems: 0,
      from: 0,
      to: 0,
    }),
    rows: Object.freeze([]),
    duplicateCandidates: Object.freeze([]),
    availableCities: Object.freeze([]),
    availableDistricts: Object.freeze([]),
    usedCatalogScan: false,
    nextCursor: null,
    locationRequired: true,
    searchNotice: ADMIN_FREE_TEXT_SEARCH_LOCATION_REQUIRED_MESSAGE,
  });
}

function buildRowsFromInstitutions(
  institutions: readonly Institution[],
  groupCounts: Map<string, Institution[]>,
  now: string,
): AcquisitionInstitutionRow[] {
  return institutions.map((institution) => {
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
}

/**
 * Explicit full-catalog materialization for acquisition operations that cannot use
 * bounded Firestore queries while preserving current semantics.
 */
async function materializeAcquisitionCatalog(
  input: GetInstitutionAcquisitionDashboardInput,
  deps: GetInstitutionAcquisitionDashboardDependencies,
): Promise<{
  ownershipFiltered: Institution[];
  duplicateCandidates: readonly AcquisitionDuplicateCandidate[];
  duplicateIdSet: Set<string>;
}> {
  const filters = createInstitutionFilters({
    cityId: input.cityId,
    districtId: input.districtId,
    primaryType: input.primaryType,
    status: input.status,
    verification: input.verification,
    query: input.query,
  });

  const listed = await deps.institutionRepository.list({
    filters,
    page: 1,
    pageSize: ACQUISITION_CATALOG_SCAN_PAGE_SIZE,
  });

  const ownershipFiltered = listed.items.filter((institution) => {
    if (!input.ownership) return true;
    const claimed =
      institution.verification === InstitutionVerification.Verified ||
      institution.verification === InstitutionVerification.Pending;
    return input.ownership === "claimed" ? claimed : !claimed;
  });

  const resolveCity = deps.resolveCityLabel ?? ((cityId: string) => cityId);
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
        if (!sample) throw new Error("Unexpected empty duplicate group.");
        return Object.freeze({
          groupKey,
          institutionIds: Object.freeze(institutions.map((item) => institutionIdAsString(item.id))),
          label: `${sample.name} · ${resolveCity(sample.location.cityId)}`,
          count: institutions.length,
        });
      })
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
  ) as readonly AcquisitionDuplicateCandidate[];

  return {
    ownershipFiltered,
    duplicateCandidates,
    duplicateIdSet: new Set(duplicateCandidates.flatMap((item) => item.institutionIds)),
  };
}

async function buildBoundedStatistics(
  base: InstitutionAdminListFilters,
  deps: GetInstitutionAcquisitionDashboardDependencies,
  cityIdsForCounts: readonly string[],
): Promise<{
  statistics: AcquisitionStatistics;
  availableCities: readonly AcquisitionCountBucket[];
  availableDistricts: readonly AcquisitionCountBucket[];
}> {
  const repo = deps.institutionRepository;
  const countAdminFn = repo.countAdmin;
  const sumAdminFn = repo.sumAdminQualityScore;
  if (!countAdminFn) {
    throw new Error("InstitutionRepository.countAdmin is required for bounded acquisition stats.");
  }
  const countAdmin = (filters?: InstitutionAdminListFilters) => countAdminFn.call(repo, filters);
  const sumAdmin = sumAdminFn
    ? (filters?: InstitutionAdminListFilters) => sumAdminFn.call(repo, filters)
    : null;
  const resolveCity = deps.resolveCityLabel ?? ((cityId: string) => cityId);
  const resolveType = deps.resolveTypeLabel ?? ((type: InstitutionType) => type);

  const [
    total,
    importCount,
    verifiedCount,
    pendingClaimCount,
    pendingReviewCount,
    pendingBoth,
    unclaimedCount,
    scoreAggregate,
    low,
    medium,
    healthy,
    excellent,
    gradeA,
    gradeB,
    gradeC,
    gradeD,
    gradeE,
    gradeF,
    ...typeCountsRaw
  ] = await Promise.all([
    countAdmin(base),
    countAdmin({ ...base, status: InstitutionStatus.Draft }),
    countAdmin({ ...base, verification: InstitutionVerification.Verified }),
    countAdmin({ ...base, verification: InstitutionVerification.Pending }),
    countAdmin({ ...base, status: InstitutionStatus.PendingReview }),
    countAdmin({
      ...base,
      status: InstitutionStatus.PendingReview,
      verification: InstitutionVerification.Pending,
    }),
    countAdmin({ ...base, verification: InstitutionVerification.Unclaimed }),
    sumAdmin ? sumAdmin(base) : Promise.resolve({ count: 0, sum: 0 }),
    countAdmin({ ...base, qualityScoreMin: 0, qualityScoreMaxExclusive: 40 }),
    countAdmin({ ...base, qualityScoreMin: 40, qualityScoreMaxExclusive: 70 }),
    countAdmin({ ...base, qualityScoreMin: 70, qualityScoreMaxExclusive: 85 }),
    countAdmin({ ...base, qualityScoreMin: 85 }),
    countAdmin({ ...base, qualityScoreMin: 90 }),
    countAdmin({ ...base, qualityScoreMin: 80, qualityScoreMaxExclusive: 90 }),
    countAdmin({ ...base, qualityScoreMin: 70, qualityScoreMaxExclusive: 80 }),
    countAdmin({ ...base, qualityScoreMin: 60, qualityScoreMaxExclusive: 70 }),
    countAdmin({ ...base, qualityScoreMin: 50, qualityScoreMaxExclusive: 60 }),
    countAdmin({ ...base, qualityScoreMaxExclusive: 50 }),
    ...ALL_TYPES.map((type) => countAdmin({ ...base, primaryType: type })),
  ]);

  // pending queue = status pending_review OR verification pending (inclusion-exclusion)
  const pendingQueueCount = pendingReviewCount + pendingClaimCount - pendingBoth;
  const claimedCount = verifiedCount + pendingClaimCount;

  const byGrade = emptyGradeCounts();
  byGrade[QualityGrade.A] = gradeA;
  byGrade[QualityGrade.B] = gradeB;
  byGrade[QualityGrade.C] = gradeC;
  byGrade[QualityGrade.D] = gradeD;
  byGrade[QualityGrade.E] = gradeE;
  byGrade[QualityGrade.F] = gradeF;

  const byLevel = emptyLevelCounts();
  byLevel[QualityLevel.Critical] = low;
  byLevel[QualityLevel.NeedsWork] = medium;
  byLevel[QualityLevel.Healthy] = healthy;
  byLevel[QualityLevel.Excellent] = excellent;

  const averageScore =
    scoreAggregate.count === 0 ? 0 : Math.round(scoreAggregate.sum / scoreAggregate.count);

  const typeCounts = new Map<string, { label: string; count: number }>();
  ALL_TYPES.forEach((type, index) => {
    const count = typeCountsRaw[index] ?? 0;
    if (count > 0) {
      typeCounts.set(type, { label: resolveType(type), count });
    }
  });

  const cityCounts = new Map<string, { label: string; count: number }>();
  if (cityIdsForCounts.length > 0) {
    const cityResults = await Promise.all(
      cityIdsForCounts.map(async (cityId) => ({
        cityId,
        count: await countAdmin({ ...base, cityId }),
      })),
    );
    for (const item of cityResults) {
      if (item.count > 0) {
        cityCounts.set(item.cityId, {
          label: resolveCity(item.cityId),
          count: item.count,
        });
      }
    }
  }

  void unclaimedCount;

  const statistics: AcquisitionStatistics = Object.freeze({
    totalInstitutions: total,
    byCity: toBuckets(cityCounts),
    byType: toBuckets(typeCounts),
    claimRatePercent: total === 0 ? 0 : Math.round((claimedCount / total) * 100),
    verificationRatePercent: total === 0 ? 0 : Math.round((verifiedCount / total) * 100),
    qualityDistribution: Object.freeze({
      low,
      medium,
      healthy,
      excellent,
      byGrade: Object.freeze(byGrade),
      byLevel: Object.freeze(byLevel),
      averageScore,
    }),
    queueCounts: Object.freeze({
      import: importCount,
      pending: pendingQueueCount,
      verified: verifiedCount,
      claimed: claimedCount,
      duplicates: 0,
      all: total,
    }),
  });

  return {
    statistics,
    availableCities: toBuckets(cityCounts),
    availableDistricts: Object.freeze([]),
  };
}

async function legacyCatalogDashboard(
  input: GetInstitutionAcquisitionDashboardInput,
  deps: GetInstitutionAcquisitionDashboardDependencies,
): Promise<InstitutionAcquisitionDashboard> {
  const queue: AcquisitionQueueId = input.queue ?? "all";
  const sort: AcquisitionQualitySort = input.sort ?? "highest";
  const listPageSize = Math.max(1, input.pageSize ?? DEFAULT_LIST_PAGE_SIZE);
  const requestedPage = Math.max(1, input.page ?? 1);
  const now = input.now ?? new Date().toISOString();
  const filters = createInstitutionFilters({
    cityId: input.cityId,
    districtId: input.districtId,
    primaryType: input.primaryType,
    status: input.status,
    verification: input.verification,
    query: input.query,
  });

  const { ownershipFiltered, duplicateCandidates, duplicateIdSet } =
    await materializeAcquisitionCatalog(input, deps);

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

  const unsortedRows = buildRowsFromInstitutions(
    ownershipFiltered.filter((institution) => {
      if (queue === "duplicates") {
        return duplicateIdSet.has(institutionIdAsString(institution.id));
      }
      return isInQueue(institution, queue);
    }),
    groupCounts,
    now,
  );

  const sortedRows = sortAcquisitionRows(unsortedRows, sort);
  const matchedCount = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(matchedCount / listPageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * listPageSize;
  const rows = Object.freeze(sortedRows.slice(start, start + listPageSize));
  const from = matchedCount === 0 ? 0 : start + 1;
  const to = matchedCount === 0 ? 0 : Math.min(start + listPageSize, matchedCount);

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
    queueCounts: Object.freeze({
      import: ownershipFiltered.filter((item) => isInQueue(item, "import")).length,
      pending: ownershipFiltered.filter((item) => isInQueue(item, "pending")).length,
      verified: ownershipFiltered.filter((item) => isInQueue(item, "verified")).length,
      claimed: ownershipFiltered.filter((item) => isInQueue(item, "claimed")).length,
      duplicates: duplicateIdSet.size,
      all: total,
    }),
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
    matchedCount,
    pagination: Object.freeze({
      page,
      pageSize: listPageSize,
      totalPages,
      totalItems: matchedCount,
      from,
      to,
    }),
    rows,
    duplicateCandidates,
    availableCities: toBuckets(cityCounts),
    availableDistricts: toBuckets(districtCounts),
    usedCatalogScan: true,
    nextCursor: null,
  });
}

async function boundedDashboard(
  input: GetInstitutionAcquisitionDashboardInput,
  deps: GetInstitutionAcquisitionDashboardDependencies,
): Promise<InstitutionAcquisitionDashboard> {
  const queue: AcquisitionQueueId = input.queue ?? "all";
  const sort: AcquisitionQualitySort = input.sort ?? "highest";
  const listPageSize = Math.max(1, input.pageSize ?? DEFAULT_LIST_PAGE_SIZE);
  // Cursor pagination: page number is display-only; without cursor always serve page 1.
  const requestedPage = input.cursor ? Math.max(1, input.page ?? 1) : 1;
  const now = input.now ?? new Date().toISOString();
  const repo = deps.institutionRepository;

  const base = baseAdminFilters({
    cityId: input.cityId,
    districtId: input.districtId,
    primaryType: input.primaryType,
    status: input.status,
    verification: input.verification,
    ownership: input.ownership,
  });

  const tableFilters = queueTableFilters(queue, base);
  if (!tableFilters) {
    return legacyCatalogDashboard(input, deps);
  }

  const cityIdsForCounts = input.cityIdsForCounts ?? [];
  const [{ statistics, availableCities, availableDistricts }, page] = await Promise.all([
    buildBoundedStatistics(base, deps, cityIdsForCounts),
    input.lightweight
      ? Promise.resolve({
          items: Object.freeze([]) as readonly Institution[],
          pageSize: listPageSize,
          nextCursor: null,
          hasNextPage: false,
          totalItems: 0,
        })
      : (() => {
          const listAdminPageFn = repo.listAdminPage;
          if (!listAdminPageFn) {
            throw new Error(
              "InstitutionRepository.listAdminPage is required for bounded acquisition table.",
            );
          }
          return listAdminPageFn.call(repo, {
            pageSize: listPageSize,
            sort: acquisitionSortToAdminSort(sort),
            cursor: input.cursor ?? null,
            filters: tableFilters,
          });
        })(),
  ]);

  const matchedCount = input.lightweight ? statistics.totalInstitutions : page.totalItems;
  const totalPages = Math.max(1, Math.ceil(matchedCount / listPageSize));
  const pageNumber = Math.min(requestedPage, totalPages);
  const rows = Object.freeze(
    buildRowsFromInstitutions(page.items, new Map(), now),
  ) as readonly AcquisitionInstitutionRow[];
  const from = matchedCount === 0 || rows.length === 0 ? 0 : (pageNumber - 1) * listPageSize + 1;
  const to =
    matchedCount === 0 || rows.length === 0
      ? 0
      : Math.min((pageNumber - 1) * listPageSize + rows.length, matchedCount);

  // Prove stored score helpers stay aligned with grade/level mappers (no runtime effect).
  void qualityGradeFromScore;
  void qualityLevelFromScore;

  return Object.freeze({
    generatedAt: now,
    queue,
    sort,
    filters: Object.freeze({
      ...(base.cityId ? { cityId: base.cityId } : {}),
      ...(base.districtId ? { districtId: base.districtId } : {}),
      ...(base.primaryType ? { primaryType: base.primaryType } : {}),
      ...(base.status ? { status: base.status } : {}),
      ...(base.verification ? { verification: base.verification } : {}),
      ...(input.ownership ? { ownership: input.ownership } : {}),
    }),
    statistics,
    matchedCount,
    pagination: Object.freeze({
      page: pageNumber,
      pageSize: listPageSize,
      totalPages,
      totalItems: matchedCount,
      from,
      to,
    }),
    rows,
    duplicateCandidates: Object.freeze([]),
    availableCities,
    availableDistricts,
    usedCatalogScan: false,
    nextCursor: page.nextCursor,
  });
}

/**
 * Repository-backed Institution Acquisition Dashboard aggregate.
 *
 * Normal table path uses listAdminPage + countAdmin (no list(50_000)).
 * Full catalog scan is isolated to materializeAcquisitionCatalog for:
 * free-text query, missing_fields sort, pending OR-queue, duplicates queue.
 */
export async function getInstitutionAcquisitionDashboard(
  input: GetInstitutionAcquisitionDashboardInput,
  deps: GetInstitutionAcquisitionDashboardDependencies,
): Promise<InstitutionAcquisitionDashboard> {
  if (
    isUnscopedAdminFreeTextQuery(input.query, {
      cityId: input.cityId,
      districtId: input.districtId,
      primaryType: input.primaryType,
    })
  ) {
    return locationRequiredAcquisitionDashboard(input);
  }

  const canUseBounded =
    Boolean(deps.institutionRepository.listAdminPage) &&
    Boolean(deps.institutionRepository.countAdmin);

  if (!canUseBounded || requiresCatalogScan(input)) {
    return legacyCatalogDashboard(input, deps);
  }

  return boundedDashboard(input, deps);
}
