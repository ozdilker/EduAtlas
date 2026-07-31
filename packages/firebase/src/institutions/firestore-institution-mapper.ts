import {
  createInstitution,
  foldTurkishText,
  type Institution,
  type InstitutionLeadCounters,
  type InstitutionWorkingHours,
  InstitutionVerification,
  institutionIdAsString,
  isWeekday,
  parseInstitutionStatus,
  parseInstitutionType,
  tokenizeSearchKeywords,
  WEEKDAYS,
  type Weekday,
} from "@eduatlas/domain";
import type { FirestoreInstitutionDocument } from "./firestore-institution-document";
import { resolveGeoLabels } from "../seeds/geo-catalog";

export type FirestoreInstitutionMapperOptions = {
  readonly searchKeywords?: readonly string[];
  readonly cityName?: string;
  readonly districtName?: string;
  /**
   * Optional override used by repository updates to preserve denormalized fields
   * (e.g. lead counters) when the incoming domain entity doesn't carry them.
   */
  readonly leadCounters?: InstitutionLeadCounters;
};

/**
 * Maps Firestore institution documents ⇄ domain Institution models.
 * Single mapping layer — repositories must not duplicate field mapping.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Task-004 requires a named FirestoreInstitutionMapper class
export class FirestoreInstitutionMapper {
  /**
   * Firestore document → domain Institution.
   */
  static toDomain(id: string, data: FirestoreInstitutionDocument): Institution {
    return createInstitution({
      id,
      name: data.name,
      slug: data.slug,
      primaryType: parseInstitutionType(data.primaryTypeId),
      status: parseInstitutionStatus(data.lifecycleStatus),
      verification: claimStatusToVerification(data.claimStatus),
      location: {
        cityId: data.cityId,
        districtId: data.districtId,
        address: data.address,
        locationNotes: data.locationNotes,
        googleMapsUrl: data.googleMapsUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        geohash: data.geohash,
      },
      contact: {
        phone: data.contactPhone,
        email: data.contactEmail,
        whatsappNumber: data.whatsappNumber,
      },
      socialLinks: {
        websiteUrl: data.websiteUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        twitterUrl: data.twitterUrl,
        youtubeUrl: data.youtubeUrl,
        linkedinUrl: data.linkedinUrl,
      },
      shortDescription: data.shortDescription,
      longDescription: data.longDescription,
      programsSummary: data.programsSummary,
      ageOrLevelFocus: data.ageOrLevelFocus,
      logoUrl: data.logoUrl,
      coverImageUrl: data.coverImageUrl,
      galleryImages: data.galleryImages,
      workingHours: data.workingHours,
      promoVideoUrl: data.promoVideoUrl,
      brochurePdfUrl: data.brochurePdfUrl,
      amenities: data.amenities,
      educationPrograms: data.educationPrograms,
      faqs: data.faqs,
      highlights: data.highlights,
      isPremium: Boolean(data.isPremium),
      qualityScore: data.qualityScore ?? 0,
      publishedAt: normalizeTimestamp(data.publishedAt),
      createdAt: requireTimestamp(data.createdAt, "createdAt"),
      updatedAt: requireTimestamp(data.updatedAt, "updatedAt"),
      updatedByUserId: data.updatedByUserId,
      leadCounters: data.leadCounters,
    });
  }

  /**
   * Domain Institution → Firestore document (no id field; id is the doc path).
   */
  static toFirestore(
    institution: Institution,
    options: FirestoreInstitutionMapperOptions = {},
  ): FirestoreInstitutionDocument {
    const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
    const cityName = options.cityName?.trim() || geo.cityName;
    const districtName = options.districtName?.trim() || geo.districtName;
    const derivedKeywords = tokenizeSearchKeywords(
      `${institution.name} ${cityName} ${districtName} ${institution.location.address}`,
    );
    const searchKeywords = [
      ...new Set(
        [...(options.searchKeywords ?? []), ...derivedKeywords]
          .map((token) => token.trim())
          .filter(Boolean),
      ),
    ];

    const document: FirestoreInstitutionDocument = {
      name: institution.name,
      slug: institution.slug,
      primaryTypeId: institution.primaryType,
      lifecycleStatus: institution.status,
      claimStatus: verificationToClaimStatus(institution.verification),
      cityId: institution.location.cityId,
      districtId: institution.location.districtId,
      address: institution.location.address,
      shortDescription: institution.shortDescription,
      isPremium: institution.isPremium,
      qualityScore: institution.qualityScore,
      nameFolded: foldTurkishText(institution.name),
      searchKeywords,
      cityName,
      districtName,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
    };

    if (institution.location.locationNotes) {
      document.locationNotes = institution.location.locationNotes;
    }
    if (institution.location.googleMapsUrl) {
      document.googleMapsUrl = institution.location.googleMapsUrl;
    }
    if (institution.location.latitude !== undefined) {
      document.latitude = institution.location.latitude;
    }
    if (institution.location.longitude !== undefined) {
      document.longitude = institution.location.longitude;
    }
    if (institution.location.geohash) {
      document.geohash = institution.location.geohash;
    }
    if (institution.contact.phone) {
      document.contactPhone = institution.contact.phone;
    }
    if (institution.contact.email) {
      document.contactEmail = institution.contact.email;
    }
    if (institution.contact.whatsappNumber) {
      document.whatsappNumber = institution.contact.whatsappNumber;
    }
    if (institution.socialLinks.websiteUrl) {
      document.websiteUrl = institution.socialLinks.websiteUrl;
    }
    if (institution.socialLinks.facebookUrl) {
      document.facebookUrl = institution.socialLinks.facebookUrl;
    }
    if (institution.socialLinks.instagramUrl) {
      document.instagramUrl = institution.socialLinks.instagramUrl;
    }
    if (institution.socialLinks.twitterUrl) {
      document.twitterUrl = institution.socialLinks.twitterUrl;
    }
    if (institution.socialLinks.youtubeUrl) {
      document.youtubeUrl = institution.socialLinks.youtubeUrl;
    }
    if (institution.socialLinks.linkedinUrl) {
      document.linkedinUrl = institution.socialLinks.linkedinUrl;
    }
    if (institution.longDescription) {
      document.longDescription = institution.longDescription;
    }
    if (institution.programsSummary) {
      document.programsSummary = institution.programsSummary;
    }
    if (institution.ageOrLevelFocus) {
      document.ageOrLevelFocus = institution.ageOrLevelFocus;
    }
    if (institution.logoUrl) {
      document.logoUrl = institution.logoUrl;
    }
    if (institution.coverImageUrl) {
      document.coverImageUrl = institution.coverImageUrl;
    }
    if (institution.galleryImages && institution.galleryImages.length > 0) {
      document.galleryImages = [...institution.galleryImages];
    }
    if (institution.workingHours) {
      document.workingHours = serializeWorkingHours(institution.workingHours);
    }
    if (institution.promoVideoUrl) {
      document.promoVideoUrl = institution.promoVideoUrl;
    }
    if (institution.brochurePdfUrl) {
      document.brochurePdfUrl = institution.brochurePdfUrl;
    }
    if (institution.amenities && institution.amenities.length > 0) {
      document.amenities = [...institution.amenities];
    } else {
      document.amenities = [];
    }
    if (institution.educationPrograms && institution.educationPrograms.length > 0) {
      document.educationPrograms = [...institution.educationPrograms];
    } else {
      document.educationPrograms = [];
    }
    if (institution.faqs && institution.faqs.length > 0) {
      document.faqs = institution.faqs.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
      }));
    }
    if (institution.highlights && institution.highlights.length > 0) {
      document.highlights = institution.highlights.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      }));
    } else {
      document.highlights = [];
    }
    if (institution.publishedAt) {
      document.publishedAt = institution.publishedAt;
    }
    if (institution.updatedByUserId) {
      document.updatedByUserId = institution.updatedByUserId;
    }

    const effectiveLeadCounters = options.leadCounters ?? institution.leadCounters;
    if (effectiveLeadCounters) {
      document.leadCounters = effectiveLeadCounters;
    }

    return document;
  }

  /**
   * Parses unknown Firestore data into a typed document, or throws.
   */
  static parseDocument(data: Record<string, unknown> | undefined): FirestoreInstitutionDocument {
    if (!data) {
      throw new Error("Firestore institution document is empty.");
    }

    return {
      name: readRequiredString(data, "name"),
      slug: readRequiredString(data, "slug"),
      primaryTypeId: readRequiredString(data, "primaryTypeId"),
      lifecycleStatus: readRequiredString(data, "lifecycleStatus"),
      claimStatus: readRequiredString(data, "claimStatus"),
      cityId: readRequiredString(data, "cityId"),
      districtId: readRequiredString(data, "districtId"),
      address: readRequiredString(data, "address"),
      locationNotes: readOptionalString(data, "locationNotes"),
      googleMapsUrl: readOptionalString(data, "googleMapsUrl"),
      latitude: readOptionalNumber(data, "latitude"),
      longitude: readOptionalNumber(data, "longitude"),
      geohash: readOptionalString(data, "geohash"),
      contactPhone: readOptionalString(data, "contactPhone"),
      contactEmail: readOptionalString(data, "contactEmail"),
      whatsappNumber: readOptionalString(data, "whatsappNumber"),
      websiteUrl: readOptionalString(data, "websiteUrl"),
      facebookUrl: readOptionalString(data, "facebookUrl"),
      instagramUrl: readOptionalString(data, "instagramUrl"),
      twitterUrl: readOptionalString(data, "twitterUrl"),
      youtubeUrl: readOptionalString(data, "youtubeUrl"),
      linkedinUrl: readOptionalString(data, "linkedinUrl"),
      shortDescription: readRequiredString(data, "shortDescription"),
      longDescription: readOptionalString(data, "longDescription"),
      programsSummary: readOptionalString(data, "programsSummary"),
      ageOrLevelFocus: readOptionalString(data, "ageOrLevelFocus"),
      logoUrl: readOptionalString(data, "logoUrl"),
      coverImageUrl: readOptionalString(data, "coverImageUrl"),
      galleryImages: (() => {
        const images = readStringArray(data, "galleryImages");
        return images.length > 0 ? images : undefined;
      })(),
      workingHours: readWorkingHours(data),
      promoVideoUrl: readOptionalString(data, "promoVideoUrl"),
      brochurePdfUrl: readOptionalString(data, "brochurePdfUrl"),
      amenities: (() => {
        const amenities = readStringArray(data, "amenities");
        return amenities.length > 0 ? amenities : undefined;
      })(),
      educationPrograms: (() => {
        const programs = readStringArray(data, "educationPrograms");
        return programs.length > 0 ? programs : undefined;
      })(),
      faqs: readFaqs(data),
      highlights: readHighlights(data),
      isPremium: Boolean(data.isPremium),
      qualityScore: typeof data.qualityScore === "number" ? data.qualityScore : 0,
      nameFolded:
        readOptionalString(data, "nameFolded") ?? foldTurkishText(readRequiredString(data, "name")),
      searchKeywords: readStringArray(data, "searchKeywords"),
      cityName: readOptionalString(data, "cityName"),
      districtName: readOptionalString(data, "districtName"),
      publishedAt: normalizeTimestamp(data.publishedAt),
      createdAt: requireTimestamp(data.createdAt, "createdAt"),
      updatedAt: requireTimestamp(data.updatedAt, "updatedAt"),
      updatedByUserId: readOptionalString(data, "updatedByUserId"),
      leadCounters: (() => {
        const raw = data.leadCounters;
        if (!raw || typeof raw !== "object") {
          return undefined;
        }

        const lc = raw as Record<string, unknown>;
        const byStatusRaw = lc.byStatus;
        const byPipelineRaw = lc.byPipeline;

        if (!byStatusRaw || typeof byStatusRaw !== "object") {
          return undefined;
        }

        if (!byPipelineRaw || typeof byPipelineRaw !== "object") {
          return undefined;
        }

        const byStatus = byStatusRaw as Record<string, unknown>;
        const byPipeline = byPipelineRaw as Record<string, unknown>;

        const readNum = (obj: Record<string, unknown>, key: string): number => {
          const v = obj[key];
          return typeof v === "number" && Number.isFinite(v) ? v : 0;
        };

        return {
          total: readNum(lc, "total"),
          pending: readNum(lc, "pending"),
          byStatus: {
            new: readNum(byStatus, "new"),
            read: readNum(byStatus, "read"),
            contacted: readNum(byStatus, "contacted"),
            appointment: readNum(byStatus, "appointment"),
            enrolled: readNum(byStatus, "enrolled"),
            lost: readNum(byStatus, "lost"),
            closed: readNum(byStatus, "closed"),
            spam: readNum(byStatus, "spam"),
          },
          byPipeline: {
            new: readNum(byPipeline, "new"),
            contacted: readNum(byPipeline, "contacted"),
            appointment: readNum(byPipeline, "appointment"),
            enrolled: readNum(byPipeline, "enrolled"),
            lost: readNum(byPipeline, "lost"),
          },
        };
      })(),
    };
  }

  static toDomainFromUnknown(id: string, data: Record<string, unknown> | undefined): Institution {
    return FirestoreInstitutionMapper.toDomain(id, FirestoreInstitutionMapper.parseDocument(data));
  }

  static institutionDocId(institution: Institution): string {
    return institutionIdAsString(institution.id);
  }
}

/** DOMAIN-MODEL claimStatus `claimed` ↔ domain `verified`. */
function claimStatusToVerification(claimStatus: string): InstitutionVerification {
  if (claimStatus === "claimed" || claimStatus === InstitutionVerification.Verified) {
    return InstitutionVerification.Verified;
  }

  if (claimStatus === InstitutionVerification.Pending) {
    return InstitutionVerification.Pending;
  }

  if (claimStatus === InstitutionVerification.Revoked) {
    return InstitutionVerification.Revoked;
  }

  return InstitutionVerification.Unclaimed;
}

function verificationToClaimStatus(verification: InstitutionVerification): string {
  if (verification === InstitutionVerification.Verified) {
    return "claimed";
  }

  return verification;
}

function readRequiredString(data: Record<string, unknown>, field: string): string {
  const value = data[field];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Firestore institution field "${field}" is required.`);
  }

  return value;
}

function readOptionalString(data: Record<string, unknown>, field: string): string | undefined {
  const value = data[field];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Firestore institution field "${field}" must be a string.`);
  }

  return value;
}

function readOptionalNumber(data: Record<string, unknown>, field: string): number | undefined {
  const value = data[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Firestore institution field "${field}" must be a number.`);
  }

  return value;
}

function readStringArray(data: Record<string, unknown>, field: string): string[] {
  const value = data[field];

  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Firestore institution field "${field}" must be a string array.`);
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTimestamp(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return requireTimestamp(value, "timestamp");
}

function requireTimestamp(value: unknown, field: string): string {
  if (typeof value === "string") {
    if (Number.isNaN(Date.parse(value))) {
      throw new Error(`Firestore institution field "${field}" must be a valid ISO timestamp.`);
    }
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  throw new Error(`Firestore institution field "${field}" must be a timestamp.`);
}

function serializeWorkingHours(
  hours: InstitutionWorkingHours,
): NonNullable<FirestoreInstitutionDocument["workingHours"]> {
  const serialized: NonNullable<FirestoreInstitutionDocument["workingHours"]> = {};
  for (const day of WEEKDAYS) {
    const entry = hours[day];
    serialized[day] = entry.isOpen
      ? {
          isOpen: true,
          openTime: entry.openTime,
          closeTime: entry.closeTime,
        }
      : { isOpen: false };
  }
  return serialized;
}

function readWorkingHours(
  data: Record<string, unknown>,
): FirestoreInstitutionDocument["workingHours"] {
  const value = data.workingHours;
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error('Firestore institution field "workingHours" must be an object.');
  }

  const source = value as Record<string, unknown>;
  const result: NonNullable<FirestoreInstitutionDocument["workingHours"]> = {};
  let hasAny = false;

  for (const [key, entry] of Object.entries(source)) {
    if (!isWeekday(key)) {
      continue;
    }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const day = entry as Record<string, unknown>;
    const isOpen = Boolean(day.isOpen);
    if (!isOpen) {
      result[key as Weekday] = { isOpen: false };
      hasAny = true;
      continue;
    }
    const openTime = typeof day.openTime === "string" ? day.openTime : undefined;
    const closeTime = typeof day.closeTime === "string" ? day.closeTime : undefined;
    result[key as Weekday] = {
      isOpen: true,
      ...(openTime ? { openTime } : {}),
      ...(closeTime ? { closeTime } : {}),
    };
    hasAny = true;
  }

  return hasAny ? result : undefined;
}

function readFaqs(
  data: Record<string, unknown>,
): FirestoreInstitutionDocument["faqs"] {
  const value = data.faqs;
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('Firestore institution field "faqs" must be an array.');
  }

  const faqs: NonNullable<FirestoreInstitutionDocument["faqs"]> = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const question = typeof row.question === "string" ? row.question.trim() : "";
    const answer = typeof row.answer === "string" ? row.answer.trim() : "";
    if (!id || !question || !answer) {
      continue;
    }
    faqs.push({ id, question, answer });
  }

  return faqs.length > 0 ? faqs : undefined;
}

function readHighlights(
  data: Record<string, unknown>,
): FirestoreInstitutionDocument["highlights"] {
  const value = data.highlights;
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error('Firestore institution field "highlights" must be an array.');
  }

  const highlights: NonNullable<FirestoreInstitutionDocument["highlights"]> = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const description = typeof row.description === "string" ? row.description.trim() : "";
    if (!id || !title || !description) {
      continue;
    }
    highlights.push({ id, title, description });
  }

  return highlights.length > 0 ? highlights : undefined;
}
