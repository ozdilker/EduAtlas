import {
  evaluateInstitutionQuality,
  type Institution,
  type InstitutionQualityScore,
  type OwnerRecommendation,
  RecommendationType,
} from "@eduatlas/domain";
import { evaluateOwnerRecommendationRules } from "../owner/recommendation-rules";

export type CalculateInstitutionQualityInput = {
  institution: Institution;
  now?: string;
};

export type CalculateInstitutionQualityResult = Readonly<{
  readonly quality: InstitutionQualityScore;
  /** Profile-oriented recommendations from the existing rule engine (no leads required). */
  readonly recommendations: readonly OwnerRecommendation[];
}>;

/**
 * Application service: calculate internal Institution Quality Score.
 * Reuses the owner recommendation engine for profile/gallery guidance.
 * No AI / LLM.
 */
export function calculateInstitutionQuality(
  input: CalculateInstitutionQualityInput,
): CalculateInstitutionQualityResult {
  const quality = evaluateInstitutionQuality({
    institution: input.institution,
    now: input.now,
  });

  const recommendations = evaluateOwnerRecommendationRules({
    institution: input.institution,
    leads: [],
    now: input.now ?? quality.calculatedAt,
  }).filter(
    (item) =>
      item.type === RecommendationType.CompleteProfile ||
      item.type === RecommendationType.UploadPhotos,
  );

  return Object.freeze({
    quality,
    recommendations: Object.freeze([...recommendations]),
  });
}
