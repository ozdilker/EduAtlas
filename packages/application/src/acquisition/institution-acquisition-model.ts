import type {
  Institution,
  InstitutionQualityScore,
  InstitutionStatus,
  InstitutionType,
  InstitutionVerification,
  OwnerRecommendation,
  QualityGrade,
  QualityLevel,
} from "@eduatlas/domain";

/**
 * Operational queues for institution acquisition / catalog ops.
 */
export type AcquisitionQueueId =
  | "import"
  | "pending"
  | "verified"
  | "claimed"
  | "duplicates"
  | "all";

export type AcquisitionQualitySort = "highest" | "lowest" | "missing_fields";

export type InstitutionQualityIndicators = Readonly<{
  readonly missingPhone: boolean;
  readonly missingWebsite: boolean;
  readonly missingDescription: boolean;
  readonly missingCoordinates: boolean;
  readonly missingCategories: boolean;
  readonly missingCount: number;
}>;

export type AcquisitionInstitutionRow = Readonly<{
  readonly institution: Institution;
  readonly qualityIndicators: InstitutionQualityIndicators;
  readonly quality: InstitutionQualityScore;
  readonly recommendations: readonly OwnerRecommendation[];
  readonly duplicateGroupKey?: string;
}>;

export type AcquisitionDuplicateCandidate = Readonly<{
  readonly groupKey: string;
  readonly institutionIds: readonly string[];
  readonly label: string;
  readonly count: number;
}>;

export type AcquisitionCountBucket = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly count: number;
}>;

export type AcquisitionQualityDistribution = Readonly<{
  readonly low: number;
  readonly medium: number;
  readonly healthy: number;
  readonly excellent: number;
  readonly byGrade: Readonly<Record<QualityGrade, number>>;
  readonly byLevel: Readonly<Record<QualityLevel, number>>;
  readonly averageScore: number;
}>;

export type AcquisitionStatistics = Readonly<{
  readonly totalInstitutions: number;
  readonly byCity: readonly AcquisitionCountBucket[];
  readonly byType: readonly AcquisitionCountBucket[];
  readonly claimRatePercent: number;
  readonly verificationRatePercent: number;
  readonly qualityDistribution: AcquisitionQualityDistribution;
  readonly queueCounts: Readonly<Record<AcquisitionQueueId, number>>;
}>;

export type AcquisitionListPagination = Readonly<{
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly from: number;
  readonly to: number;
}>;

export type InstitutionAcquisitionDashboard = Readonly<{
  readonly generatedAt: string;
  readonly queue: AcquisitionQueueId;
  readonly sort: AcquisitionQualitySort;
  readonly filters: Readonly<{
    readonly cityId?: string;
    readonly districtId?: string;
    readonly primaryType?: InstitutionType;
    readonly status?: InstitutionStatus;
    readonly verification?: InstitutionVerification;
    readonly ownership?: "unclaimed" | "claimed";
    readonly query?: string;
  }>;
  readonly statistics: AcquisitionStatistics;
  /** Queue + filter matched total (not the current page slice length). */
  readonly matchedCount: number;
  readonly pagination: AcquisitionListPagination;
  readonly rows: readonly AcquisitionInstitutionRow[];
  readonly duplicateCandidates: readonly AcquisitionDuplicateCandidate[];
  readonly availableCities: readonly AcquisitionCountBucket[];
  readonly availableDistricts: readonly AcquisitionCountBucket[];
}>;
