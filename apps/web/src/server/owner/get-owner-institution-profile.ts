import type { InstitutionRepository } from "@eduatlas/application";
import { getOwnerInstitutionProfile } from "@eduatlas/application";
import {
  createEmptyInstitutionWorkingHours,
  institutionIdAsString,
  listInstitutionAmenityOptions,
  listInstitutionEducationProgramOptions,
  WEEKDAYS,
  type Weekday,
} from "@eduatlas/domain";
import type {
  OwnerInstitutionProfilePageViewData,
  OwnerWorkingHoursFormValue,
} from "@eduatlas/ui";
import { getInstitutionRepository } from "../institutions/repository";
import { getOwnerDemoInstitutionId } from "./owner-demo-context";

export type GetOwnerInstitutionProfileViewOptions = {
  institutionId?: string;
  institutionRepository?: InstitutionRepository;
};

function toWorkingHoursFormValue(
  hours: ReturnType<typeof createEmptyInstitutionWorkingHours> | undefined,
): OwnerWorkingHoursFormValue {
  const source = hours ?? createEmptyInstitutionWorkingHours();
  const result = {} as OwnerWorkingHoursFormValue;
  for (const day of WEEKDAYS) {
    const entry = source[day as Weekday];
    result[day] = {
      isOpen: entry.isOpen,
      openTime: entry.openTime ?? "09:00",
      closeTime: entry.closeTime ?? "18:00",
    };
  }
  return result;
}

/**
 * Loads owner profile editor view data via application service + repositories.
 */
export async function getOwnerInstitutionProfileView(
  options: GetOwnerInstitutionProfileViewOptions = {},
): Promise<OwnerInstitutionProfilePageViewData | null> {
  const institutionId = options.institutionId ?? getOwnerDemoInstitutionId();
  const institutionRepository = options.institutionRepository ?? (await getInstitutionRepository());

  const institution = await getOwnerInstitutionProfile(
    { institutionId },
    { institutionRepository },
  );

  if (!institution) {
    return null;
  }

  return {
    form: {
      institutionId: institutionIdAsString(institution.id),
      institutionName: institution.name,
      publicProfileHref: `/institutions/${institution.slug}`,
      logoUrl: institution.logoUrl,
      coverImageUrl: institution.coverImageUrl,
      galleryImages: institution.galleryImages ?? [],
      brochurePdfUrl: institution.brochurePdfUrl,
      amenityOptions: listInstitutionAmenityOptions(institution.amenities),
      educationProgramOptions: listInstitutionEducationProgramOptions(
        institution.educationPrograms,
      ),
      faqs: (institution.faqs ?? []).map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
      })),
      highlights: (institution.highlights ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })),
      workingHours: toWorkingHoursFormValue(institution.workingHours),
      shortDescription: institution.shortDescription,
      longDescription: institution.longDescription ?? "",
      phone: institution.contact.phone ?? "",
      whatsappNumber: institution.contact.whatsappNumber ?? "",
      email: institution.contact.email ?? "",
      address: institution.location.address,
      googleMapsUrl: institution.location.googleMapsUrl ?? "",
      websiteUrl: institution.socialLinks.websiteUrl ?? "",
      facebookUrl: institution.socialLinks.facebookUrl ?? "",
      instagramUrl: institution.socialLinks.instagramUrl ?? "",
      twitterUrl: institution.socialLinks.twitterUrl ?? "",
      youtubeUrl: institution.socialLinks.youtubeUrl ?? "",
      linkedinUrl: institution.socialLinks.linkedinUrl ?? "",
      promoVideoUrl: institution.promoVideoUrl ?? "",
      updatedAtLabel: formatDateTime(institution.updatedAt),
      updatedByLabel: institution.updatedByUserId
        ? `Düzenleyen: ${institution.updatedByUserId}`
        : "",
    },
  };
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
