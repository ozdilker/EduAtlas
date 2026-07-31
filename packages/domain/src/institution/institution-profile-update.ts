import { createInstitution, type Institution } from "./institution";
import { createInstitutionContact, hasPublishableContact } from "./institution-contact";
import { createInstitutionId, institutionIdAsString } from "./institution-id";
import { createInstitutionSocialLinks } from "./institution-social-links";
import { InstitutionStatus } from "./institution-status";
import { createInstitutionPromoVideoUrl } from "./institution-promo-video";
import {
  createInstitutionAmenities,
  type InstitutionAmenities,
} from "./institution-amenities";
import {
  createInstitutionEducationPrograms,
  type InstitutionEducationPrograms,
} from "./institution-education-programs";
import {
  createInstitutionFaqs,
  type CreateInstitutionFaqItemInput,
  type InstitutionFaqs,
} from "./institution-faqs";
import {
  createInstitutionHighlights,
  type CreateInstitutionHighlightItemInput,
  type InstitutionHighlights,
} from "./institution-highlights";
import {
  createInstitutionWorkingHours,
  type CreateInstitutionWorkingHoursInput,
  type InstitutionWorkingHours,
} from "./institution-working-hours";

const ADDRESS_MAX_LENGTH = 500;

/**
 * Owner-editable public profile fields (allowlist).
 */
export type InstitutionProfileUpdate = Readonly<{
  readonly institutionId: string;
  readonly shortDescription: string;
  readonly longDescription?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly whatsappNumber?: string;
  readonly address: string;
  readonly googleMapsUrl?: string;
  readonly websiteUrl?: string;
  readonly facebookUrl?: string;
  readonly instagramUrl?: string;
  readonly twitterUrl?: string;
  readonly youtubeUrl?: string;
  readonly linkedinUrl?: string;
  readonly workingHours?: InstitutionWorkingHours;
  readonly promoVideoUrl?: string;
  readonly amenities: InstitutionAmenities;
  readonly educationPrograms: InstitutionEducationPrograms;
  readonly faqs: InstitutionFaqs;
  readonly highlights: InstitutionHighlights;
  readonly updatedAt: string;
  readonly updatedBy: string;
}>;

export type CreateInstitutionProfileUpdateInput = {
  institutionId: string;
  shortDescription: string;
  longDescription?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  address: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  workingHours?: CreateInstitutionWorkingHoursInput;
  promoVideoUrl?: string;
  amenities?: readonly string[];
  educationPrograms?: readonly string[];
  faqs?: readonly CreateInstitutionFaqItemInput[];
  highlights?: readonly CreateInstitutionHighlightItemInput[];
  updatedAt: string;
  updatedBy: string;
};

/**
 * Creates an immutable InstitutionProfileUpdate command (editable published fields only).
 */
export function createInstitutionProfileUpdate(
  input: CreateInstitutionProfileUpdateInput,
): InstitutionProfileUpdate {
  const institutionId = input.institutionId.trim();
  const shortDescription = input.shortDescription.trim();
  const longDescription = input.longDescription?.trim();
  const phone = input.phone?.trim();
  const email = input.email?.trim();
  const whatsappNumber = input.whatsappNumber?.trim();
  const address = input.address.trim();
  const updatedBy = input.updatedBy.trim();

  if (!institutionId) {
    throw new Error("InstitutionProfileUpdate.institutionId is required.");
  }
  createInstitutionId(institutionId);

  if (!shortDescription) {
    throw new Error("InstitutionProfileUpdate.shortDescription is required.");
  }
  if (shortDescription.length > 500) {
    throw new Error("InstitutionProfileUpdate.shortDescription must be at most 500 characters.");
  }
  if (longDescription && longDescription.length > 5000) {
    throw new Error("InstitutionProfileUpdate.longDescription must be at most 5000 characters.");
  }
  if (!updatedBy) {
    throw new Error("InstitutionProfileUpdate.updatedBy is required.");
  }
  if (Number.isNaN(Date.parse(input.updatedAt))) {
    throw new Error("InstitutionProfileUpdate.updatedAt must be a valid ISO timestamp.");
  }

  if (!address) {
    throw new Error("InstitutionProfileUpdate.address is required.");
  }
  if (address.length > ADDRESS_MAX_LENGTH) {
    throw new Error(
      `InstitutionProfileUpdate.address must be at most ${ADDRESS_MAX_LENGTH} characters.`,
    );
  }

  const contact = createInstitutionContact({
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    ...(whatsappNumber ? { whatsappNumber } : {}),
  });
  if (!hasPublishableContact(contact)) {
    throw new Error("InstitutionProfileUpdate requires phone or email.");
  }

  const googleMapsUrl = normalizeOptionalHttpUrl(input.googleMapsUrl, "googleMapsUrl");

  const socialLinks = createInstitutionSocialLinks({
    websiteUrl: input.websiteUrl,
    facebookUrl: input.facebookUrl,
    instagramUrl: input.instagramUrl,
    twitterUrl: input.twitterUrl,
    youtubeUrl: input.youtubeUrl,
    linkedinUrl: input.linkedinUrl,
  });

  const workingHours = input.workingHours
    ? createInstitutionWorkingHours(input.workingHours)
    : undefined;

  const promoVideoUrl = createInstitutionPromoVideoUrl(input.promoVideoUrl);
  const amenities = createInstitutionAmenities(input.amenities);
  const educationPrograms = createInstitutionEducationPrograms(input.educationPrograms);
  const faqs = createInstitutionFaqs(input.faqs);
  const highlights = createInstitutionHighlights(input.highlights);

  return Object.freeze({
    institutionId,
    shortDescription,
    ...(longDescription ? { longDescription } : {}),
    ...(contact.phone ? { phone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.whatsappNumber ? { whatsappNumber: contact.whatsappNumber } : {}),
    address,
    ...(googleMapsUrl ? { googleMapsUrl } : {}),
    ...(socialLinks.websiteUrl ? { websiteUrl: socialLinks.websiteUrl } : {}),
    ...(socialLinks.facebookUrl ? { facebookUrl: socialLinks.facebookUrl } : {}),
    ...(socialLinks.instagramUrl ? { instagramUrl: socialLinks.instagramUrl } : {}),
    ...(socialLinks.twitterUrl ? { twitterUrl: socialLinks.twitterUrl } : {}),
    ...(socialLinks.youtubeUrl ? { youtubeUrl: socialLinks.youtubeUrl } : {}),
    ...(socialLinks.linkedinUrl ? { linkedinUrl: socialLinks.linkedinUrl } : {}),
    ...(workingHours ? { workingHours } : {}),
    ...(promoVideoUrl ? { promoVideoUrl } : {}),
    amenities,
    educationPrograms,
    faqs,
    highlights,
    updatedAt: input.updatedAt,
    updatedBy,
  });
}

function normalizeOptionalHttpUrl(value: string | undefined, field: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
    return url.toString();
  } catch {
    throw new Error(`InstitutionProfileUpdate.${field} must be a valid http(s) URL.`);
  }
}

/**
 * Applies an allowlisted profile update onto an existing Institution.
 * Does not change name, slug, status, city/district, gallery, or programs.
 */
export function applyInstitutionProfileUpdate(
  institution: Institution,
  update: InstitutionProfileUpdate,
): Institution {
  if (institutionIdAsString(institution.id) !== update.institutionId) {
    throw new Error("InstitutionProfileUpdate.institutionId does not match Institution.id.");
  }

  if (institution.status !== InstitutionStatus.Published) {
    throw new Error("Only published institutions can receive owner profile updates.");
  }

  return createInstitution({
    id: institutionIdAsString(institution.id),
    name: institution.name,
    slug: institution.slug,
    primaryType: institution.primaryType,
    status: institution.status,
    verification: institution.verification,
    location: {
      cityId: institution.location.cityId,
      districtId: institution.location.districtId,
      address: update.address,
      locationNotes: institution.location.locationNotes,
      googleMapsUrl: update.googleMapsUrl,
      latitude: institution.location.latitude,
      longitude: institution.location.longitude,
      geohash: institution.location.geohash,
    },
    contact: {
      phone: update.phone,
      email: update.email,
      whatsappNumber: update.whatsappNumber,
    },
    socialLinks: {
      websiteUrl: update.websiteUrl,
      facebookUrl: update.facebookUrl,
      instagramUrl: update.instagramUrl,
      twitterUrl: update.twitterUrl,
      youtubeUrl: update.youtubeUrl,
      linkedinUrl: update.linkedinUrl,
    },
    shortDescription: update.shortDescription,
    longDescription: update.longDescription,
    programsSummary: institution.programsSummary,
    ageOrLevelFocus: institution.ageOrLevelFocus,
    logoUrl: institution.logoUrl,
    coverImageUrl: institution.coverImageUrl,
    galleryImages: institution.galleryImages,
    workingHours: update.workingHours ?? institution.workingHours,
    promoVideoUrl: update.promoVideoUrl,
    brochurePdfUrl: institution.brochurePdfUrl,
    amenities: update.amenities,
    educationPrograms: update.educationPrograms,
    faqs: update.faqs,
    highlights: update.highlights,
    isPremium: institution.isPremium,
    qualityScore: institution.qualityScore,
    publishedAt: institution.publishedAt,
    createdAt: institution.createdAt,
    updatedAt: update.updatedAt,
    updatedByUserId: update.updatedBy,
  });
}
