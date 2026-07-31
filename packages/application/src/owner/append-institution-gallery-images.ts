import {
  createInstitution,
  createInstitutionId,
  INSTITUTION_GALLERY_MAX_IMAGES,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";
import { withRecalculatedInstitutionQuality } from "../institution-quality/with-recalculated-institution-quality";
import {
  InstitutionNotFoundError,
  InstitutionProfileValidationError,
} from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";

export type AppendInstitutionGalleryImagesInput = Readonly<{
  readonly institutionId: string;
  /** Download URLs to append (order preserved). */
  readonly imageUrls: readonly string[];
  readonly updatedBy: string;
  readonly updatedAt?: string;
}>;

export type AppendInstitutionGalleryImagesDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
}>;

/**
 * Appends gallery download URLs to the institution document.
 * Does not touch logo/cover. Caps at INSTITUTION_GALLERY_MAX_IMAGES.
 */
export async function appendInstitutionGalleryImages(
  input: AppendInstitutionGalleryImagesInput,
  deps: AppendInstitutionGalleryImagesDependencies,
): Promise<Institution> {
  const institutionId = createInstitutionId(input.institutionId);
  const existing = await deps.institutionRepository.getById(institutionId);

  if (!existing) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const incoming = input.imageUrls.map((url) => url.trim()).filter(Boolean);
  if (incoming.length === 0) {
    throw new InstitutionProfileValidationError("Eklenecek galeri görseli yok.");
  }

  const current = existing.galleryImages ? [...existing.galleryImages] : [];
  const remainingSlots = INSTITUTION_GALLERY_MAX_IMAGES - current.length;

  if (remainingSlots <= 0) {
    throw new InstitutionProfileValidationError(
      `Galeri en fazla ${INSTITUTION_GALLERY_MAX_IMAGES} görsel içerebilir.`,
    );
  }

  if (incoming.length > remainingSlots) {
    throw new InstitutionProfileValidationError(
      `Galeriye en fazla ${remainingSlots} görsel daha eklenebilir (limit ${INSTITUTION_GALLERY_MAX_IMAGES}).`,
    );
  }

  const now = input.updatedAt ?? new Date().toISOString();
  const galleryImages = Object.freeze([...current, ...incoming]);

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
