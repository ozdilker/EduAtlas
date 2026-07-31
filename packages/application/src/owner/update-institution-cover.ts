import {
  createInstitution,
  createInstitutionId,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";

export type UpdateInstitutionCoverInput = Readonly<{
  readonly institutionId: string;
  /** Public download URL from Storage. */
  readonly coverImageUrl: string;
  /** Optional Storage object path (accepted for cleanup callers; not a schema field). */
  readonly coverPath?: string;
  readonly updatedBy: string;
  readonly updatedAt?: string;
}>;

export type UpdateInstitutionCoverDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
}>;

/**
 * Updates only the institution coverImageUrl (and audit fields). Does not touch logo/gallery.
 */
export async function updateInstitutionCover(
  input: UpdateInstitutionCoverInput,
  deps: UpdateInstitutionCoverDependencies,
): Promise<Institution> {
  const institutionId = createInstitutionId(input.institutionId);
  const existing = await deps.institutionRepository.getById(institutionId);

  if (!existing) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const coverImageUrl = input.coverImageUrl.trim();
  if (!coverImageUrl) {
    throw new Error("coverImageUrl is required.");
  }

  void input.coverPath;

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
    coverImageUrl,
    galleryImages: existing.galleryImages,
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

  return deps.institutionRepository.update(next);
}
