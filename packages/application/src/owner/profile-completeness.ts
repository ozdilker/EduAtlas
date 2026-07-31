import type { Institution } from "@eduatlas/domain";
import {
  evaluateInstitutionProfileCompleteness,
  type InstitutionProfileCompleteness,
} from "@eduatlas/domain";

/**
 * Compatibility adapter used by recommendation rules and older callers.
 * Delegates to the weighted Profile Completeness Engine.
 */
export type ProfileCompletenessResult = Readonly<{
  readonly scorePercent: number;
  readonly filled: number;
  readonly total: number;
  readonly hasGalleryImages: boolean;
  readonly completeness: InstitutionProfileCompleteness;
}>;

/**
 * Computes weighted profile completeness (0–100) for an institution.
 */
export function computeInstitutionProfileCompleteness(
  institution: Institution,
): ProfileCompletenessResult {
  const completeness = evaluateInstitutionProfileCompleteness(institution);
  const hasGalleryImages =
    (institution.galleryImages?.length ?? 0) > 0 ||
    Boolean(institution.coverImageUrl?.trim()) ||
    Boolean(institution.logoUrl?.trim());

  return Object.freeze({
    scorePercent: completeness.overallPercentage,
    filled: completeness.completedSections.length,
    total: completeness.sections.length,
    hasGalleryImages,
    completeness,
  });
}
