import type { QualityDimension } from "./quality-dimension";
import type { QualityGrade } from "./quality-grade";
import type { QualityIssue } from "./quality-issue";
import type { QualityLevel } from "./quality-level";

export type QualityDimensionScore = Readonly<{
  readonly dimension: QualityDimension;
  readonly earned: number;
  readonly max: number;
  readonly complete: boolean;
}>;

/**
 * Internal Institution Quality Score — distinct from public Growth Score.
 */
export type InstitutionQualityScore = Readonly<{
  readonly institutionId: string;
  readonly score: number;
  readonly grade: QualityGrade;
  readonly qualityLevel: QualityLevel;
  readonly missingFields: readonly string[];
  readonly qualityIssues: readonly QualityIssue[];
  readonly dimensions: readonly QualityDimensionScore[];
  readonly calculatedAt: string;
}>;

export type CreateInstitutionQualityScoreInput = {
  institutionId: string;
  score: number;
  grade: QualityGrade;
  qualityLevel: QualityLevel;
  missingFields: readonly string[];
  qualityIssues: readonly QualityIssue[];
  dimensions: readonly QualityDimensionScore[];
  calculatedAt: string;
};

export function createInstitutionQualityScore(
  input: CreateInstitutionQualityScoreInput,
): InstitutionQualityScore {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    throw new Error("InstitutionQualityScore.institutionId is required.");
  }
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > 100) {
    throw new Error("InstitutionQualityScore.score must be between 0 and 100.");
  }
  if (Number.isNaN(Date.parse(input.calculatedAt))) {
    throw new Error("InstitutionQualityScore.calculatedAt must be an ISO timestamp.");
  }

  return Object.freeze({
    institutionId,
    score: Math.round(input.score),
    grade: input.grade,
    qualityLevel: input.qualityLevel,
    missingFields: Object.freeze([...input.missingFields]),
    qualityIssues: Object.freeze([...input.qualityIssues]),
    dimensions: Object.freeze([...input.dimensions]),
    calculatedAt: input.calculatedAt,
  });
}
