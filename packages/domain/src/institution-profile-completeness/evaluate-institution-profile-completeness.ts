import type { Institution } from "../institution/institution";
import { institutionIdAsString } from "../institution/institution-id";
import {
  createInstitutionProfileCompleteness,
  type InstitutionProfileCompleteness,
  PROFILE_COMPLETENESS_SECTION_DEFINITIONS,
} from "./institution-profile-completeness";
import { createProfileCompletenessSection } from "./profile-completeness-section";
import { ProfileCompletenessSectionId } from "./profile-completeness-section-id";

/**
 * Evaluates weighted profile completeness for an Institution (pure domain).
 * Gallery uses cover image until a dedicated gallery collection exists.
 */
export function evaluateInstitutionProfileCompleteness(
  institution: Institution,
): InstitutionProfileCompleteness {
  const checks: Record<ProfileCompletenessSectionId, boolean> = {
    [ProfileCompletenessSectionId.BasicInformation]: Boolean(institution.name.trim()),
    [ProfileCompletenessSectionId.Description]: Boolean(
      institution.shortDescription.trim() && institution.longDescription?.trim(),
    ),
    [ProfileCompletenessSectionId.Contact]: Boolean(
      institution.contact.phone?.trim() || institution.contact.email?.trim(),
    ),
    [ProfileCompletenessSectionId.Website]: Boolean(institution.socialLinks.websiteUrl?.trim()),
    [ProfileCompletenessSectionId.SocialLinks]: Boolean(
      institution.socialLinks.facebookUrl?.trim() ||
        institution.socialLinks.instagramUrl?.trim() ||
        institution.socialLinks.twitterUrl?.trim() ||
        institution.socialLinks.youtubeUrl?.trim() ||
        institution.socialLinks.linkedinUrl?.trim(),
    ),
    [ProfileCompletenessSectionId.Gallery]: Boolean(
      institution.coverImageUrl?.trim() || (institution.galleryImages?.length ?? 0) > 0,
    ),
    [ProfileCompletenessSectionId.Programs]: Boolean(
      institution.programsSummary?.trim() || (institution.educationPrograms?.length ?? 0) > 0,
    ),
    [ProfileCompletenessSectionId.Amenities]: (institution.amenities?.length ?? 0) > 0,
    [ProfileCompletenessSectionId.Logo]: Boolean(institution.logoUrl?.trim()),
    [ProfileCompletenessSectionId.Location]: Boolean(
      institution.location.address?.trim() &&
        institution.location.cityId?.trim() &&
        institution.location.districtId?.trim(),
    ),
  };

  const sections = PROFILE_COMPLETENESS_SECTION_DEFINITIONS.map((definition) =>
    createProfileCompletenessSection({
      id: definition.id,
      label: definition.label,
      weight: definition.weight,
      completed: checks[definition.id],
      hint: definition.hint,
    }),
  );

  return createInstitutionProfileCompleteness({
    institutionId: institutionIdAsString(institution.id),
    sections,
  });
}
