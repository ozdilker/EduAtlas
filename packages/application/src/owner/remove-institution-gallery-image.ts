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

export type RemoveInstitutionGalleryImageInput = Readonly<{
  readonly institutionId: string;
  /** Exact download URL to remove from galleryImages. */
  readonly imageUrl: string;
  readonly updatedBy: string;
  readonly updatedAt?: string;
}>;

export type RemoveInstitutionGalleryImageDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
}>;

/**
 * Removes a single gallery download URL from the institution document.
 * Does not touch logo/cover or Storage bytes (caller deletes Storage first).
 */
export async function removeInstitutionGalleryImage(
  input: RemoveInstitutionGalleryImageInput,
  deps: RemoveInstitutionGalleryImageDependencies,
): Promise<Institution> {
  const institutionId = createInstitutionId(input.institutionId);
  const existing = await deps.institutionRepository.getById(institutionId);

  if (!existing) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const imageUrl = input.imageUrl.trim();
  if (!imageUrl) {
    throw new InstitutionProfileValidationError("Silinecek galeri görseli belirtilmedi.");
  }

  const current = existing.galleryImages ? [...existing.galleryImages] : [];
  const index = current.indexOf(imageUrl);
  if (index < 0) {
    throw new InstitutionProfileValidationError("Galeri görseli bulunamadı.");
  }

  current.splice(index, 1);
  const now = input.updatedAt ?? new Date().toISOString();
  const galleryImages = current.length > 0 ? Object.freeze(current) : undefined;

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
    galleryImages,
    workingHours: existing.workingHours,
    promoVideoUrl: existing.promoVideoUrl,
    brochurePdfUrl: existing.brochurePdfUrl,
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
