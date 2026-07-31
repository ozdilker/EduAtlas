"use server";

import {
  isInstitutionNotFoundError,
  isInstitutionProfileValidationError,
  updateInstitutionProfile,
} from "@eduatlas/application";
import {
  type CreateInstitutionFaqItemInput,
  type CreateInstitutionHighlightItemInput,
  type CreateInstitutionWorkingHoursInput,
  WEEKDAYS,
  type Weekday,
} from "@eduatlas/domain";
import type { OwnerInstitutionProfileFormState } from "@eduatlas/ui";
import { revalidatePath } from "next/cache";
import { getInstitutionRepository } from "../institutions/repository";
import { getNotificationService } from "../notifications/repository";
import { requireOwnerContext } from "./require-owner-context";

function normalizeTimeValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  // Some browsers post `HH:mm:ss` from <input type="time">.
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }
  return `${match[1]}:${match[2]}`;
}

function parseWorkingHoursFromForm(formData: FormData): CreateInstitutionWorkingHoursInput {
  const result: CreateInstitutionWorkingHoursInput = {};
  for (const day of WEEKDAYS) {
    result[day as Weekday] = {
      isOpen: String(formData.get(`hours.${day}.isOpen`) ?? "") === "1",
      openTime: normalizeTimeValue(String(formData.get(`hours.${day}.openTime`) ?? "")),
      closeTime: normalizeTimeValue(String(formData.get(`hours.${day}.closeTime`) ?? "")),
    };
  }
  return result;
}

function parseFaqsFromForm(formData: FormData): CreateInstitutionFaqItemInput[] {
  const faqs: CreateInstitutionFaqItemInput[] = [];
  for (let index = 0; ; index += 1) {
    const questionKey = `faqs.${index}.question`;
    if (!formData.has(questionKey)) {
      break;
    }
    faqs.push({
      id: String(formData.get(`faqs.${index}.id`) ?? "").trim(),
      question: String(formData.get(questionKey) ?? ""),
      answer: String(formData.get(`faqs.${index}.answer`) ?? ""),
    });
  }
  return faqs;
}

function parseHighlightsFromForm(formData: FormData): CreateInstitutionHighlightItemInput[] {
  const highlights: CreateInstitutionHighlightItemInput[] = [];
  for (let index = 0; ; index += 1) {
    const titleKey = `highlights.${index}.title`;
    if (!formData.has(titleKey)) {
      break;
    }
    highlights.push({
      id: String(formData.get(`highlights.${index}.id`) ?? "").trim(),
      title: String(formData.get(titleKey) ?? ""),
      description: String(formData.get(`highlights.${index}.description`) ?? ""),
    });
  }
  return highlights;
}

/**
 * Server action: owner profile form → updateInstitutionProfile application service.
 */
export async function updateOwnerInstitutionProfileAction(
  _prevState: OwnerInstitutionProfileFormState,
  formData: FormData,
): Promise<OwnerInstitutionProfileFormState> {
  const { user, institutionId } = await requireOwnerContext();
  const formInstitutionId = String(formData.get("institutionId") ?? "").trim();

  if (formInstitutionId && formInstitutionId !== institutionId) {
    return {
      ok: false,
      message: "Kurum kimliği eşleşmiyor.",
    };
  }

  try {
    const [institutionRepository, notificationService] = await Promise.all([
      getInstitutionRepository(),
      getNotificationService(),
    ]);
    const result = await updateInstitutionProfile(
      {
        institutionId,
        shortDescription: String(formData.get("shortDescription") ?? ""),
        longDescription: String(formData.get("longDescription") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
        address: String(formData.get("address") ?? ""),
        googleMapsUrl: String(formData.get("googleMapsUrl") ?? ""),
        websiteUrl: String(formData.get("websiteUrl") ?? ""),
        facebookUrl: String(formData.get("facebookUrl") ?? ""),
        instagramUrl: String(formData.get("instagramUrl") ?? ""),
        twitterUrl: String(formData.get("twitterUrl") ?? ""),
        youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
        linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
        workingHours: parseWorkingHoursFromForm(formData),
        promoVideoUrl: String(formData.get("promoVideoUrl") ?? ""),
        amenities: formData.getAll("amenities").map((value) => String(value)),
        educationPrograms: formData.getAll("educationPrograms").map((value) => String(value)),
        faqs: parseFaqsFromForm(formData),
        highlights: parseHighlightsFromForm(formData),
        updatedBy: user.uid,
      },
      {
        institutionRepository,
        notificationService,
        actorEmail: user.email,
      },
    );

    revalidatePath("/owner");
    revalidatePath("/owner/profile");
    revalidatePath(`/institutions/${result.institution.slug}`);

    return {
      ok: true,
      message: "Profil güncellendi. Değişiklikler genel sayfaya yansıtıldı.",
    };
  } catch (error) {
    if (isInstitutionProfileValidationError(error) || isInstitutionNotFoundError(error)) {
      return {
        ok: false,
        message: error.message,
      };
    }
    throw error;
  }
}
