import { createInstitutionId } from "../institution/institution-id";
import {
  createProfileCompletenessSection,
  type ProfileCompletenessSection,
} from "./profile-completeness-section";
import { ProfileCompletenessSectionId } from "./profile-completeness-section-id";

/**
 * Institution Profile Completeness result — foundation for future Growth Score.
 * Not Growth Score.
 */
export type InstitutionProfileCompleteness = Readonly<{
  readonly institutionId: string;
  readonly overallPercentage: number;
  readonly completedSections: readonly ProfileCompletenessSection[];
  readonly missingSections: readonly ProfileCompletenessSection[];
  readonly sections: readonly ProfileCompletenessSection[];
  /** Highest-weight missing section tip for the dashboard card. */
  readonly nextActionHint: string;
}>;

export type CreateInstitutionProfileCompletenessInput = {
  institutionId: string;
  sections: readonly ProfileCompletenessSection[];
};

/**
 * Builds an immutable InstitutionProfileCompleteness aggregate from weighted sections.
 */
export function createInstitutionProfileCompleteness(
  input: CreateInstitutionProfileCompletenessInput,
): InstitutionProfileCompleteness {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    throw new Error("InstitutionProfileCompleteness.institutionId is required.");
  }
  createInstitutionId(institutionId);

  if (input.sections.length === 0) {
    throw new Error("InstitutionProfileCompleteness.sections must not be empty.");
  }

  const sections = Object.freeze(
    input.sections.map((section) => createProfileCompletenessSection(section)),
  );
  const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0);
  const earnedWeight = sections
    .filter((section) => section.completed)
    .reduce((sum, section) => sum + section.weight, 0);

  const overallPercentage = Math.round((earnedWeight / totalWeight) * 100);
  const completedSections = Object.freeze(sections.filter((section) => section.completed));
  const missingSections = Object.freeze(
    [...sections.filter((section) => !section.completed)].sort((left, right) => {
      const byWeight = right.weight - left.weight;
      if (byWeight !== 0) return byWeight;
      return left.id.localeCompare(right.id);
    }),
  );

  const nextActionHint =
    missingSections[0]?.hint ?? "Profiliniz tamam. Görünürlüğü korumak için güncel tutun.";

  return Object.freeze({
    institutionId,
    overallPercentage,
    completedSections,
    missingSections,
    sections,
    nextActionHint,
  });
}

/**
 * Canonical section definitions and Turkish owner-facing hints.
 */
export const PROFILE_COMPLETENESS_SECTION_DEFINITIONS: ReadonlyArray<{
  readonly id: ProfileCompletenessSectionId;
  readonly label: string;
  readonly weight: number;
  readonly hint: string;
}> = Object.freeze([
  Object.freeze({
    id: ProfileCompletenessSectionId.BasicInformation,
    label: "Temel bilgiler",
    weight: 10,
    hint: "Temel kurum bilgilerini tamamlayın.",
  }),
  Object.freeze({
    id: ProfileCompletenessSectionId.Description,
    label: "Açıklama",
    weight: 15,
    hint: "Kısa ve uzun açıklamayı zenginleştirerek ebeveyn güvenini artırın.",
  }),
  Object.freeze({
    id: ProfileCompletenessSectionId.Contact,
    label: "İletişim",
    weight: 15,
    hint: "Telefon veya e-posta ekleyerek talepleri kaçırmayın.",
  }),
  Object.freeze({
    id: ProfileCompletenessSectionId.Website,
    label: "Web sitesi",
    weight: 10,
    hint: "Web sitesi bağlantısı ekleyerek güvenilirliği artırın.",
  }),
  Object.freeze({
    id: ProfileCompletenessSectionId.SocialLinks,
    label: "Sosyal bağlantılar",
    weight: 10,
    hint: "Sosyal medya hesaplarını ekleyerek görünürlüğü artırın.",
  }),
  Object.freeze({
    id: ProfileCompletenessSectionId.Gallery,
    label: "Galeri",
    weight: 15,
    hint: "Görünürlüğü artırmak için galeri fotoğrafları ekleyin.",
  }),
  Object.freeze({
    id: ProfileCompletenessSectionId.Programs,
    label: "Programlar",
    weight: 10,
    hint: "Program özetini ekleyerek ebeveynlerin aradığını bulmasını kolaylaştırın.",
  }),
  Object.freeze({
    id: ProfileCompletenessSectionId.Logo,
    label: "Logo",
    weight: 5,
    hint: "Logo yükleyerek kurum kimliğinizi güçlendirin.",
  }),
  Object.freeze({
    id: ProfileCompletenessSectionId.Location,
    label: "Konum",
    weight: 10,
    hint: "Adres ve konum bilgilerini tamamlayın.",
  }),
]);
