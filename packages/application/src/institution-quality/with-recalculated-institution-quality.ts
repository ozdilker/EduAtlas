import {
  createInstitution,
  type CreateInstitutionInput,
  evaluateInstitutionQuality,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";

/**
 * Maps an Institution aggregate back to createInstitution input (field-preserving).
 */
export function toCreateInstitutionInput(institution: Institution): CreateInstitutionInput {
  return {
    id: institutionIdAsString(institution.id),
    name: institution.name,
    slug: institution.slug,
    primaryType: institution.primaryType,
    status: institution.status,
    verification: institution.verification,
    location: {
      cityId: institution.location.cityId,
      districtId: institution.location.districtId,
      address: institution.location.address,
      locationNotes: institution.location.locationNotes,
      googleMapsUrl: institution.location.googleMapsUrl,
      latitude: institution.location.latitude,
      longitude: institution.location.longitude,
      geohash: institution.location.geohash,
    },
    contact: {
      phone: institution.contact.phone,
      email: institution.contact.email,
      whatsappNumber: institution.contact.whatsappNumber,
    },
    socialLinks: {
      websiteUrl: institution.socialLinks.websiteUrl,
      facebookUrl: institution.socialLinks.facebookUrl,
      instagramUrl: institution.socialLinks.instagramUrl,
      twitterUrl: institution.socialLinks.twitterUrl,
      youtubeUrl: institution.socialLinks.youtubeUrl,
      linkedinUrl: institution.socialLinks.linkedinUrl,
    },
    shortDescription: institution.shortDescription,
    longDescription: institution.longDescription,
    programsSummary: institution.programsSummary,
    ageOrLevelFocus: institution.ageOrLevelFocus,
    logoUrl: institution.logoUrl,
    coverImageUrl: institution.coverImageUrl,
    galleryImages: institution.galleryImages,
    workingHours: institution.workingHours,
    promoVideoUrl: institution.promoVideoUrl,
    brochurePdfUrl: institution.brochurePdfUrl,
    amenities: institution.amenities,
    educationPrograms: institution.educationPrograms,
    faqs: institution.faqs,
    highlights: institution.highlights,
    isPremium: institution.isPremium,
    qualityScore: institution.qualityScore,
    publishedAt: institution.publishedAt,
    createdAt: institution.createdAt,
    updatedAt: institution.updatedAt,
    updatedByUserId: institution.updatedByUserId,
    leadCounters: institution.leadCounters,
    googleBusiness: institution.googleBusiness,
  };
}

/**
 * Recomputes and persists-ready Institution.qualityScore from current profile fields.
 */
export function withRecalculatedInstitutionQuality(
  institution: Institution,
  now?: string,
): Institution {
  const quality = evaluateInstitutionQuality({
    institution,
    now: now ?? institution.updatedAt,
  });

  if (institution.qualityScore === quality.score) {
    return institution;
  }

  return createInstitution({
    ...toCreateInstitutionInput(institution),
    qualityScore: quality.score,
  });
}
