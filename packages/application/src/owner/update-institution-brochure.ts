import {
  createInstitution,
  createInstitutionId,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";

export type UpdateInstitutionBrochureInput = Readonly<{
  readonly institutionId: string;
  /** Public PDF download URL from Storage. */
  readonly brochurePdfUrl: string;
  /** Optional Storage object path (not persisted; URL only in Firestore). */
  readonly brochurePath?: string;
  readonly updatedBy: string;
  readonly updatedAt?: string;
}>;

export type UpdateInstitutionBrochureDependencies = Readonly<{
  readonly institutionRepository: InstitutionRepository;
}>;

/**
 * Updates only brochurePdfUrl (and audit fields). Firestore stores the URL only.
 */
export async function updateInstitutionBrochure(
  input: UpdateInstitutionBrochureInput,
  deps: UpdateInstitutionBrochureDependencies,
): Promise<Institution> {
  const institutionId = createInstitutionId(input.institutionId);
  const existing = await deps.institutionRepository.getById(institutionId);

  if (!existing) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const brochurePdfUrl = input.brochurePdfUrl.trim();
  if (!brochurePdfUrl) {
    throw new Error("brochurePdfUrl is required.");
  }

  void input.brochurePath;

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
    brochurePdfUrl,
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
