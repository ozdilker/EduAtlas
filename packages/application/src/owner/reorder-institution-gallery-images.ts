import {
  createInstitution,
  createInstitutionId,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";
import {
  InstitutionNotFoundError,
  InstitutionProfileValidationError,
} from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";

export type ReorderInstitutionGalleryImagesInput = Readonly<{
  readonly institutionId: string;
  /** Full gallery order (must be a permutation of the current URLs). */
  readonly imageUrls: readonly string[];
  readonly updatedBy: string;
  readonly updatedAt?: string;
}>;

export type ReorderInstitutionGalleryImagesDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
}>;

function isSameUrlMultiset(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const counts = new Map<string, number>();
  for (const url of left) {
    counts.set(url, (counts.get(url) ?? 0) + 1);
  }
  for (const url of right) {
    const next = (counts.get(url) ?? 0) - 1;
    if (next < 0) {
      return false;
    }
    counts.set(url, next);
  }
  return true;
}

/**
 * Replaces galleryImages order only. No Storage I/O. Same URLs required.
 */
export async function reorderInstitutionGalleryImages(
  input: ReorderInstitutionGalleryImagesInput,
  deps: ReorderInstitutionGalleryImagesDependencies,
): Promise<Institution> {
  const institutionId = createInstitutionId(input.institutionId);
  const existing = await deps.institutionRepository.getById(institutionId);

  if (!existing) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const current = existing.galleryImages ? [...existing.galleryImages] : [];
  const incoming = input.imageUrls.map((url) => url.trim()).filter(Boolean);

  if (current.length === 0) {
    throw new InstitutionProfileValidationError("Sıralanacak galeri görseli yok.");
  }

  if (!isSameUrlMultiset(current, incoming)) {
    throw new InstitutionProfileValidationError(
      "Galeri sırası geçersiz. Görseller değiştirilemez; yalnızca sıra güncellenir.",
    );
  }

  const unchanged =
    current.length === incoming.length && current.every((url, index) => url === incoming[index]);
  if (unchanged) {
    return existing;
  }

  const now = input.updatedAt ?? new Date().toISOString();
  const galleryImages = Object.freeze([...incoming]);

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
    isPremium: existing.isPremium,
    qualityScore: existing.qualityScore,
    publishedAt: existing.publishedAt,
    createdAt: existing.createdAt,
    updatedAt: now,
    updatedByUserId: input.updatedBy,
  });

  return deps.institutionRepository.update(next);
}
