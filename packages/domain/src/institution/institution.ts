import {
  type CreateInstitutionContactInput,
  createInstitutionContact,
  type InstitutionContact,
} from "./institution-contact";
import { createInstitutionId, type InstitutionId } from "./institution-id";
import {
  type CreateInstitutionLocationInput,
  createInstitutionLocation,
  type InstitutionLocation,
} from "./institution-location";
import {
  type CreateInstitutionSocialLinksInput,
  createInstitutionSocialLinks,
  type InstitutionSocialLinks,
} from "./institution-social-links";
import { InstitutionStatus } from "./institution-status";
import { type InstitutionType, parseInstitutionType } from "./institution-type";
import { InstitutionVerification, parseInstitutionVerification } from "./institution-verification";
import {
  createInstitutionWorkingHours,
  type CreateInstitutionWorkingHoursInput,
  type InstitutionWorkingHours,
} from "./institution-working-hours";
import { createInstitutionPromoVideoUrl } from "./institution-promo-video";
import {
  createInstitutionAmenities,
  type InstitutionAmenities,
} from "./institution-amenities";
import {
  createInstitutionEducationPrograms,
  type InstitutionEducationPrograms,
} from "./institution-education-programs";
import { createInstitutionFaqs, type InstitutionFaqs } from "./institution-faqs";
import {
  createInstitutionHighlights,
  type InstitutionHighlights,
} from "./institution-highlights";
import { assertValidInstitutionSlug, normalizeInstitutionSlug } from "./validation";
import type { InstitutionLeadCounters } from "./institution-lead-counters";
import {
  createGoogleBusinessSnapshot,
  type CreateGoogleBusinessSnapshotInput,
  type GoogleBusinessSnapshot,
} from "./google-business-snapshot";

/**
 * Canonical Institution aggregate root (pure domain).
 */
export type Institution = Readonly<{
  readonly id: InstitutionId;
  readonly name: string;
  readonly slug: string;
  readonly primaryType: InstitutionType;
  readonly status: InstitutionStatus;
  readonly verification: InstitutionVerification;
  readonly location: InstitutionLocation;
  readonly contact: InstitutionContact;
  readonly socialLinks: InstitutionSocialLinks;
  readonly shortDescription: string;
  readonly longDescription?: string;
  readonly programsSummary?: string;
  readonly ageOrLevelFocus?: string;
  readonly logoUrl?: string;
  readonly coverImageUrl?: string;
  /** Public gallery image URLs (download URLs only). */
  readonly galleryImages?: readonly string[];
  /** Weekly opening hours (Mon–Sun). */
  readonly workingHours?: InstitutionWorkingHours;
  /** Promotional YouTube or Vimeo video URL (canonical). */
  readonly promoVideoUrl?: string;
  /** Public brochure / PDF download URL (Storage URL only). */
  readonly brochurePdfUrl?: string;
  /** Selected facility / amenity ids. */
  readonly amenities?: InstitutionAmenities;
  /** Selected education program ids. */
  readonly educationPrograms?: InstitutionEducationPrograms;
  /** Owner-managed FAQ list (ordered). */
  readonly faqs?: InstitutionFaqs;
  /** Owner-managed highlight cards for the public profile (ordered). */
  readonly highlights?: InstitutionHighlights;
  readonly isPremium: boolean;
  readonly qualityScore: number;
  readonly publishedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Last editor user id (audit); optional until owner auth is wired. */
  readonly updatedByUserId?: string;
  /**
   * Denormalized lead counters used by owner surfaces (optional until triggers populate it).
   */
  readonly leadCounters?: InstitutionLeadCounters;
  /**
   * Cached Google Business / Places snapshot (lazy sync). Never includes review bodies.
   */
  readonly googleBusiness?: GoogleBusinessSnapshot;
}>;

export type CreateInstitutionInput = {
  id: string;
  name: string;
  slug: string;
  primaryType: InstitutionType | string;
  status?: InstitutionStatus;
  verification?: InstitutionVerification | string;
  location: CreateInstitutionLocationInput;
  contact?: CreateInstitutionContactInput;
  socialLinks?: CreateInstitutionSocialLinksInput;
  shortDescription: string;
  longDescription?: string;
  programsSummary?: string;
  ageOrLevelFocus?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  galleryImages?: readonly string[];
  workingHours?: CreateInstitutionWorkingHoursInput | InstitutionWorkingHours;
  promoVideoUrl?: string;
  brochurePdfUrl?: string;
  amenities?: readonly string[];
  educationPrograms?: readonly string[];
  faqs?: readonly { id?: string; question: string; answer: string }[];
  highlights?: readonly { id?: string; title: string; description: string }[];
  isPremium?: boolean;
  qualityScore?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  updatedByUserId?: string;
  leadCounters?: InstitutionLeadCounters;
  googleBusiness?: CreateGoogleBusinessSnapshotInput | GoogleBusinessSnapshot;
};

/**
 * Creates an immutable Institution entity.
 */
export function createInstitution(input: CreateInstitutionInput): Institution {
  const name = input.name.trim();
  const slug = normalizeInstitutionSlug(input.slug);
  const shortDescription = input.shortDescription.trim();
  const longDescription = input.longDescription?.trim();
  const programsSummary = input.programsSummary?.trim();
  const ageOrLevelFocus = input.ageOrLevelFocus?.trim();
  const logoUrl = input.logoUrl?.trim();
  const coverImageUrl = input.coverImageUrl?.trim();
  const galleryImages = normalizeGalleryImages(input.galleryImages);
  const workingHours = input.workingHours
    ? createInstitutionWorkingHours(input.workingHours)
    : undefined;
  const promoVideoUrl = createInstitutionPromoVideoUrl(input.promoVideoUrl);
  const brochurePdfUrl = normalizeOptionalHttpUrl(input.brochurePdfUrl, "brochurePdfUrl");
  const amenities = input.amenities ? createInstitutionAmenities(input.amenities) : undefined;
  const educationPrograms = input.educationPrograms
    ? createInstitutionEducationPrograms(input.educationPrograms)
    : undefined;
  const faqs = input.faqs ? createInstitutionFaqs(input.faqs) : undefined;
  const highlights = input.highlights ? createInstitutionHighlights(input.highlights) : undefined;
  const updatedByUserId = input.updatedByUserId?.trim();
  const leadCounters = input.leadCounters;
  const googleBusiness = input.googleBusiness
    ? createGoogleBusinessSnapshot(input.googleBusiness)
    : undefined;
  const status = input.status ?? InstitutionStatus.Draft;
  const verification = input.verification
    ? typeof input.verification === "string"
      ? parseInstitutionVerification(input.verification)
      : input.verification
    : InstitutionVerification.Unclaimed;
  const primaryType =
    typeof input.primaryType === "string"
      ? parseInstitutionType(input.primaryType)
      : input.primaryType;
  const qualityScore = input.qualityScore ?? 0;

  if (!name) {
    throw new Error("Institution.name is required.");
  }

  assertValidInstitutionSlug(slug);

  if (!shortDescription) {
    throw new Error("Institution.shortDescription is required.");
  }

  if (longDescription && longDescription.length > 5000) {
    throw new Error("Institution.longDescription must be at most 5000 characters.");
  }

  if (qualityScore < 0 || qualityScore > 100) {
    throw new Error("Institution.qualityScore must be between 0 and 100.");
  }

  if (galleryImages && galleryImages.length > INSTITUTION_GALLERY_MAX_IMAGES) {
    throw new Error(
      `Institution.galleryImages must have at most ${INSTITUTION_GALLERY_MAX_IMAGES} items.`,
    );
  }

  assertIsoTimestamp(input.createdAt, "createdAt");
  assertIsoTimestamp(input.updatedAt, "updatedAt");

  if (input.publishedAt !== undefined) {
    assertIsoTimestamp(input.publishedAt, "publishedAt");
  }

  if (status === InstitutionStatus.Published && !input.publishedAt) {
    throw new Error("Institution.publishedAt is required when status is published.");
  }

  return Object.freeze({
    id: createInstitutionId(input.id),
    name,
    slug,
    primaryType,
    status,
    verification,
    location: createInstitutionLocation(input.location),
    contact: createInstitutionContact(input.contact ?? {}),
    socialLinks: createInstitutionSocialLinks(input.socialLinks),
    shortDescription,
    ...(longDescription ? { longDescription } : {}),
    ...(programsSummary ? { programsSummary } : {}),
    ...(ageOrLevelFocus ? { ageOrLevelFocus } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(galleryImages && galleryImages.length > 0 ? { galleryImages } : {}),
    ...(workingHours ? { workingHours } : {}),
    ...(promoVideoUrl ? { promoVideoUrl } : {}),
    ...(brochurePdfUrl ? { brochurePdfUrl } : {}),
    ...(amenities && amenities.length > 0 ? { amenities } : {}),
    ...(educationPrograms && educationPrograms.length > 0 ? { educationPrograms } : {}),
    ...(faqs && faqs.length > 0 ? { faqs } : {}),
    ...(highlights && highlights.length > 0 ? { highlights } : {}),
    isPremium: Boolean(input.isPremium),
    qualityScore,
    ...(input.publishedAt ? { publishedAt: input.publishedAt } : {}),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    ...(updatedByUserId ? { updatedByUserId } : {}),
    ...(leadCounters ? { leadCounters } : {}),
    ...(googleBusiness ? { googleBusiness } : {}),
  });
}

/** First-version gallery slot cap (owner profile gallery). */
export const INSTITUTION_GALLERY_MAX_IMAGES = 20;

function normalizeGalleryImages(
  images: readonly string[] | undefined,
): readonly string[] | undefined {
  if (!images) {
    return undefined;
  }
  return Object.freeze(images.map((url) => url.trim()).filter(Boolean));
}

function assertIsoTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Institution.${field} must be a valid ISO timestamp.`);
  }
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
    throw new Error(`Institution.${field} must be a valid http(s) URL.`);
  }
}
