import {
  applyInstitutionProfileUpdate,
  createInstitutionId,
  createInstitutionProfileUpdate,
  type CreateInstitutionWorkingHoursInput,
  type Institution,
  type InstitutionProfileUpdate,
  InstitutionStatus,
} from "@eduatlas/domain";
import {
  InstitutionNotFoundError,
  InstitutionProfileValidationError,
} from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { emitProfileUpdated } from "../notifications/emit-notification-events";
import type { NotificationService } from "../notifications/notification-service";

export type UpdateInstitutionProfileInput = {
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
  faqs?: readonly { id?: string; question: string; answer: string }[];
  highlights?: readonly { id?: string; title: string; description: string }[];
  updatedBy: string;
  updatedAt?: string;
};

export type UpdateInstitutionProfileResult = Readonly<{
  readonly institution: Institution;
  readonly update: InstitutionProfileUpdate;
}>;

export type UpdateInstitutionProfileDependencies = {
  institutionRepository: InstitutionRepository;
  notificationService?: NotificationService;
  /** Optional email for Profile Updated transactional mail. */
  actorEmail?: string;
};

/**
 * Application service: update allowlisted published profile fields via repository.
 * Notifications are optional and never fail the profile write.
 */
export async function updateInstitutionProfile(
  input: UpdateInstitutionProfileInput,
  deps: UpdateInstitutionProfileDependencies,
): Promise<UpdateInstitutionProfileResult> {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    throw new InstitutionProfileValidationError("Institution.id is required.");
  }

  let update: InstitutionProfileUpdate;
  try {
    update = createInstitutionProfileUpdate({
      institutionId,
      shortDescription: input.shortDescription,
      longDescription: input.longDescription,
      phone: input.phone,
      email: input.email,
      whatsappNumber: input.whatsappNumber,
      address: input.address,
      googleMapsUrl: input.googleMapsUrl,
      websiteUrl: input.websiteUrl,
      facebookUrl: input.facebookUrl,
      instagramUrl: input.instagramUrl,
      twitterUrl: input.twitterUrl,
      youtubeUrl: input.youtubeUrl,
      linkedinUrl: input.linkedinUrl,
      workingHours: input.workingHours,
      promoVideoUrl: input.promoVideoUrl,
      amenities: input.amenities,
      educationPrograms: input.educationPrograms,
      faqs: input.faqs,
      highlights: input.highlights,
      updatedAt: input.updatedAt ?? new Date().toISOString(),
      updatedBy: input.updatedBy,
    });
  } catch (error) {
    throw new InstitutionProfileValidationError(
      error instanceof Error ? error.message : "Invalid institution profile update.",
    );
  }

  const existing = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!existing) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  if (existing.status !== InstitutionStatus.Published) {
    throw new InstitutionProfileValidationError(
      "Only published institutions can receive owner profile updates.",
    );
  }

  let next: Institution;
  try {
    next = applyInstitutionProfileUpdate(existing, update);
  } catch (error) {
    throw new InstitutionProfileValidationError(
      error instanceof Error ? error.message : "Unable to apply institution profile update.",
    );
  }

  const saved = await deps.institutionRepository.update(next);

  if (deps.notificationService && input.updatedBy.trim()) {
    try {
      await emitProfileUpdated(deps.notificationService, {
        userId: input.updatedBy.trim(),
        email: deps.actorEmail,
        institutionId,
        institutionName: saved.name,
        now: update.updatedAt,
      });
    } catch {
      // Fail-open: profile persistence already succeeded.
    }
  }

  return Object.freeze({
    institution: saved,
    update,
  });
}

export type GetOwnerInstitutionProfileInput = {
  institutionId: string;
};

export type GetOwnerInstitutionProfileDependencies = {
  institutionRepository: InstitutionRepository;
};

/**
 * Loads the institution aggregate for the owner profile editor.
 */
export async function getOwnerInstitutionProfile(
  input: GetOwnerInstitutionProfileInput,
  deps: GetOwnerInstitutionProfileDependencies,
): Promise<Institution | null> {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    return null;
  }

  const institution = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    return null;
  }

  if (institution.status !== InstitutionStatus.Published) {
    return null;
  }

  return institution;
}
