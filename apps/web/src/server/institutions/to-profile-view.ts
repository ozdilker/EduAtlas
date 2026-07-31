import {
  getInstitutionTypeSlug,
  type Institution,
  INSTITUTION_AMENITY_LABELS_TR,
  INSTITUTION_EDUCATION_PROGRAM_LABELS_TR,
  type InstitutionAmenityId,
  type InstitutionEducationProgramId,
  type InstitutionSearchGeoLabels,
  InstitutionType,
  InstitutionVerification,
  institutionIdAsString,
  isInstitutionVerified,
  isPubliclyVisibleStatus,
  WEEKDAY_LABELS_TR,
  WEEKDAYS,
  type Weekday,
} from "@eduatlas/domain";
import type { InstitutionCardViewData, InstitutionProfileViewData } from "@eduatlas/ui";
import { resolveFirebaseStorageVariantUrl } from "@eduatlas/firebase/storage";

const IMAGE_VARIANTS_ENABLED =
  process.env.EDUATLAS_IMAGE_VARIANTS_ENABLED?.trim().toLowerCase() === "1" ||
  process.env.EDUATLAS_IMAGE_VARIANTS_ENABLED?.trim().toLowerCase() === "true";

const TYPE_LABELS: Readonly<Record<InstitutionType, string>> = Object.freeze({
  [InstitutionType.PrivateSchool]: "Özel Okul",
  [InstitutionType.Dershane]: "Dershane",
  [InstitutionType.EtutMerkezi]: "Etüt Merkezi",
  [InstitutionType.LanguageSchool]: "Dil Okulu",
  [InstitutionType.Kindergarten]: "Anaokulu",
  [InstitutionType.Preschool]: "Kreş",
});

/**
 * Turkish public label for an institution type.
 */
export function getInstitutionTypeLabel(type: InstitutionType): string {
  return TYPE_LABELS[type];
}

/**
 * Maps a domain Institution (+ geo labels / related cards) to UI profile view data.
 */
export function toInstitutionProfileView(
  institution: Institution,
  geo: InstitutionSearchGeoLabels,
  related: readonly InstitutionCardViewData[] = [],
): InstitutionProfileViewData {
  const typeSlug = getInstitutionTypeSlug(institution.primaryType);
  const typeLabel = getInstitutionTypeLabel(institution.primaryType);
  const cityHref = `/cities/${geo.citySlug}`;
  const districtHref = `/cities/${geo.citySlug}/${geo.districtSlug}`;
  const typeHref = `/categories/${typeSlug}`;
  const verified = isInstitutionVerified(institution.verification);

  return {
    id: institutionIdAsString(institution.id),
    slug: institution.slug,
    name: institution.name,
    typeLabel,
    city: geo.cityName,
    cityHref,
    district: geo.districtName,
    districtHref,
    typeHref,
    verified,
    premium: institution.isPremium,
    featured: false,
    summary: institution.shortDescription,
    address: institution.location.address,
    googleMapsUrl: institution.location.googleMapsUrl,
    ...(institution.location.latitude !== undefined
      ? { latitude: institution.location.latitude }
      : {}),
    ...(institution.location.longitude !== undefined
      ? { longitude: institution.location.longitude }
      : {}),
    breadcrumbs: [
      { id: "home", label: "Ana sayfa", href: "/" },
      { id: "city", label: geo.cityName, href: cityHref },
      { id: "district", label: geo.districtName, href: districtHref },
      { id: "type", label: typeLabel, href: typeHref },
      { id: "current", label: institution.name },
    ],
    quickFacts: buildQuickFacts(institution, typeLabel),
    highlights: buildHighlights(institution),
    programs: buildPrograms(institution),
    amenities: buildAmenities(institution),
    workingHours: buildWorkingHours(institution),
    logoUrl: IMAGE_VARIANTS_ENABLED
      ? resolveFirebaseStorageVariantUrl({
          url: institution.logoUrl,
          variant: "medium_800",
        }) ?? institution.logoUrl
      : institution.logoUrl,
    coverImageUrl: IMAGE_VARIANTS_ENABLED
      ? resolveFirebaseStorageVariantUrl({
          url: institution.coverImageUrl,
          variant: "medium_800",
        }) ?? institution.coverImageUrl
      : institution.coverImageUrl,
    brochurePdfUrl: institution.brochurePdfUrl,
    gallery: buildGallery(institution),
    contact: buildContact(institution),
    socialLinks: buildSocialLinks(institution),
    related: [...related],
  };
}

/**
 * Maps a domain Institution to a presentation card.
 */
export function toInstitutionCardView(
  institution: Institution,
  geo: InstitutionSearchGeoLabels,
): InstitutionCardViewData {
  return {
    id: institutionIdAsString(institution.id),
    name: institution.name,
    href: `/institutions/${institution.slug}`,
    typeLabel: getInstitutionTypeLabel(institution.primaryType),
    typeSlug: getInstitutionTypeSlug(institution.primaryType),
    city: geo.cityName,
    district: geo.districtName,
    snippet: institution.shortDescription,
    ...(institution.coverImageUrl ? { imageSrc: institution.coverImageUrl } : {}),
    badges: {
      verified: isInstitutionVerified(institution.verification),
      premium: institution.isPremium,
    },
    ctaLabel: "İncele",
  };
}

export function isPublicInstitution(institution: Institution): boolean {
  return isPubliclyVisibleStatus(institution.status);
}

function buildQuickFacts(institution: Institution, typeLabel: string) {
  const facts = [{ id: "type", label: "Kurum türü", value: typeLabel }];

  if (institution.ageOrLevelFocus) {
    facts.push({ id: "age", label: "Yaş / seviye", value: institution.ageOrLevelFocus });
  }

  facts.push({
    id: "verification",
    label: "Doğrulama",
    value: verificationLabel(institution.verification),
  });

  if (institution.isPremium) {
    facts.push({ id: "plan", label: "Plan", value: "Premium" });
  }

  return facts;
}

function buildHighlights(institution: Institution) {
  const highlights = [
    {
      id: "summary",
      title: "Kurum özeti",
      description: institution.shortDescription,
    },
  ];

  if (institution.programsSummary) {
    highlights.push({
      id: "programs",
      title: "Programlar",
      description: institution.programsSummary,
    });
  }

  if (institution.longDescription) {
    highlights.push({
      id: "long-description",
      title: "Detaylı açıklama",
      description: institution.longDescription,
    });
  }

  if (institution.location.locationNotes) {
    highlights.push({
      id: "location-notes",
      title: "Konum notu",
      description: institution.location.locationNotes,
    });
  }

  return highlights;
}

function buildPrograms(institution: Institution): InstitutionProfileViewData["programs"] {
  const selected = institution.educationPrograms ?? [];
  if (selected.length > 0) {
    return selected.map((programId) => ({
      id: programId,
      name: INSTITUTION_EDUCATION_PROGRAM_LABELS_TR[programId as InstitutionEducationProgramId],
    }));
  }

  if (institution.programsSummary) {
    return [
      {
        id: "programs",
        name: "Program özeti",
        summary: institution.programsSummary,
      },
    ];
  }

  return [];
}

function buildAmenities(institution: Institution): InstitutionProfileViewData["amenities"] {
  return (institution.amenities ?? []).map((amenityId) => ({
    id: amenityId,
    label: INSTITUTION_AMENITY_LABELS_TR[amenityId as InstitutionAmenityId],
  }));
}

function buildWorkingHours(institution: Institution): InstitutionProfileViewData["workingHours"] {
  const hours = institution.workingHours;
  if (!hours) {
    return [];
  }

  return WEEKDAYS.map((day) => {
    const entry = hours[day as Weekday];
    return {
      id: day,
      label: WEEKDAY_LABELS_TR[day as Weekday],
      isOpen: entry.isOpen,
      ...(entry.isOpen && entry.openTime && entry.closeTime
        ? { hoursLabel: `${entry.openTime} – ${entry.closeTime}` }
        : {}),
    };
  });
}

function buildGallery(institution: Institution): InstitutionProfileViewData["gallery"] {
  const images = institution.galleryImages ?? [];
  return images.map((imageUrl, index) => ({
    id: `gallery-${index + 1}`,
    label: `${institution.name} galeri görseli ${index + 1}`,
    imageUrl: IMAGE_VARIANTS_ENABLED
      ? resolveFirebaseStorageVariantUrl({ url: imageUrl, variant: "medium_800" }) ?? imageUrl
      : imageUrl,
  }));
}

function buildContact(institution: Institution) {
  const items: InstitutionProfileViewData["contact"] = [];

  if (institution.contact.phone) {
    const phone = institution.contact.phone;
    items.push({
      id: "phone",
      label: "Telefon",
      value: phone,
      href: `tel:${phone.replaceAll(/\s+/g, "")}`,
    });
  }

  if (institution.contact.whatsappNumber) {
    const digits = institution.contact.whatsappNumber.replaceAll(/\D/g, "");
    items.push({
      id: "whatsapp",
      label: "WhatsApp",
      value: "Mesaj gönder",
      href: `https://wa.me/${digits}`,
    });
  }

  if (institution.contact.email) {
    items.push({
      id: "email",
      label: "E-posta",
      value: institution.contact.email,
      href: `mailto:${institution.contact.email}`,
    });
  }

  if (institution.socialLinks.websiteUrl) {
    const website = institution.socialLinks.websiteUrl;
    items.push({
      id: "web",
      label: "Web sitesi",
      value: website.replace(/^https?:\/\//, ""),
      href: website,
    });
  }

  if (institution.brochurePdfUrl) {
    items.push({
      id: "brochure",
      label: "Broşür",
      value: "PDF indir",
      href: institution.brochurePdfUrl,
    });
  }

  return items;
}

function displaySocialUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function buildSocialLinks(institution: Institution): InstitutionProfileViewData["socialLinks"] {
  const items: InstitutionProfileViewData["socialLinks"] = [];
  const links = institution.socialLinks;

  if (links.instagramUrl) {
    items.push({
      id: "instagram",
      label: "Instagram",
      value: displaySocialUrl(links.instagramUrl),
      href: links.instagramUrl,
    });
  }

  if (links.facebookUrl) {
    items.push({
      id: "facebook",
      label: "Facebook",
      value: displaySocialUrl(links.facebookUrl),
      href: links.facebookUrl,
    });
  }

  if (links.twitterUrl) {
    items.push({
      id: "twitter",
      label: "X",
      value: displaySocialUrl(links.twitterUrl),
      href: links.twitterUrl,
    });
  }

  if (links.youtubeUrl) {
    items.push({
      id: "youtube",
      label: "YouTube",
      value: displaySocialUrl(links.youtubeUrl),
      href: links.youtubeUrl,
    });
  }

  if (links.linkedinUrl) {
    items.push({
      id: "linkedin",
      label: "LinkedIn",
      value: displaySocialUrl(links.linkedinUrl),
      href: links.linkedinUrl,
    });
  }

  return items;
}

function verificationLabel(verification: InstitutionVerification): string {
  switch (verification) {
    case InstitutionVerification.Verified:
      return "Doğrulanmış";
    case InstitutionVerification.Pending:
      return "Doğrulama bekliyor";
    case InstitutionVerification.Revoked:
      return "İptal edildi";
    default:
      return "Sahipsiz";
  }
}
