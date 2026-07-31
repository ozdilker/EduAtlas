import {
  createInstitution,
  createInstitutionId,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";
import { withRecalculatedInstitutionQuality } from "../institution-quality/with-recalculated-institution-quality";
import {
  InstitutionNotFoundError,
  InstitutionProfileValidationError,
} from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";

export type RemoveInstitutionBrochureInput = Readonly<{
  readonly institutionId: string;
  /** Exact download URL expected on the institution (guard against stale clients). */
  readonly brochurePdfUrl: string;
  readonly updatedBy: string;
  readonly updatedAt?: string;
}>;

export type RemoveInstitutionBrochureDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
}>;

/**
 * Clears brochurePdfUrl from the institution document.
 * Does not delete Storage bytes (caller deletes Storage first).
 */
export async function removeInstitutionBrochure(
  input: RemoveInstitutionBrochureInput,
  deps: RemoveInstitutionBrochureDependencies,
): Promise<Institution> {
  const institutionId = createInstitutionId(input.institutionId);
  const existing = await deps.institutionRepository.getById(institutionId);

  if (!existing) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const brochurePdfUrl = input.brochurePdfUrl.trim();
  if (!brochurePdfUrl) {
    throw new InstitutionProfileValidationError("Silinecek broşür belirtilmedi.");
  }

  if (!existing.brochurePdfUrl || existing.brochurePdfUrl !== brochurePdfUrl) {
    throw new InstitutionProfileValidationError("Broşür bulunamadı.");
  }

  const now = input.updatedAt ?? new Date().toISOString();

  const next = createInstitution({
    id: institutionIdAsString(existing.id),
    name: existing.name,
    slug: existing.slug,
    primaryType: existing.primaryType,
    status: existing.status,
    verification: existing.verification,
    location: existing.location,
    contact: existing.contact,
    socialLinks: existing.socialLinks,
    shortDescription: existing.shortDescription,
    longDescription: existing.longDescription,
    programsSummary: existing.programsSummary,
    ageOrLevelFocus: existing.ageOrLevelFocus,
    logoUrl: existing.logoUrl,
    coverImageUrl: existing.coverImageUrl,
    galleryImages: existing.galleryImages,
    workingHours: existing.workingHours,
    promoVideoUrl: existing.promoVideoUrl,
    amenities: existing.amenities,
    educationPrograms: existing.educationPrograms,
    faqs: existing.faqs,
    highlights: existing.highlights,
    isPremium: existing.isPremium,
    qualityScore: existing.qualityScore,
    publishedAt: existing.publishedAt,
    createdAt: existing.createdAt,
    updatedAt: now,
    updatedByUserId: input.updatedBy,
  });

  return deps.institutionRepository.update(withRecalculatedInstitutionQuality(next, now));
}
