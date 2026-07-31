import {
  createInstitution,
  createInstitutionId,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";

export type UpdateInstitutionLogoInput = Readonly<{
  readonly institutionId: string;
  /** Public download URL from Storage. */
  readonly logoUrl: string;
  /** Optional Storage object path (not persisted unless domain gains logoPath). */
  readonly logoPath?: string;
  readonly updatedBy: string;
  readonly updatedAt?: string;
}>;

export type UpdateInstitutionLogoDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
}>;

/**
 * Updates only the institution logoUrl (and audit fields). Does not touch cover/gallery.
 */
export async function updateInstitutionLogo(
  input: UpdateInstitutionLogoInput,
  deps: UpdateInstitutionLogoDependencies,
): Promise<Institution> {
  const institutionId = createInstitutionId(input.institutionId);
  const existing = await deps.institutionRepository.getById(institutionId);

  if (!existing) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const logoUrl = input.logoUrl.trim();
  if (!logoUrl) {
    throw new Error("logoUrl is required.");
  }

  // logoPath is accepted for callers that track Storage paths; institution aggregate
  // currently persists logoUrl only (existing schema field).
  void input.logoPath;

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
    logoUrl,
    coverImageUrl: existing.coverImageUrl,
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
