/**
 * Weighted profile completeness sections (foundation for future Growth Score).
 * Not Growth Score itself.
 */
export enum ProfileCompletenessSectionId {
  BasicInformation = "basic_information",
  Description = "description",
  Contact = "contact",
  Website = "website",
  SocialLinks = "social_links",
  Gallery = "gallery",
  Programs = "programs",
  Logo = "logo",
  Location = "location",
}

const SECTION_ID_VALUES: ReadonlySet<string> = new Set(Object.values(ProfileCompletenessSectionId));

export function isProfileCompletenessSectionId(
  value: string,
): value is ProfileCompletenessSectionId {
  return SECTION_ID_VALUES.has(value);
}

export function parseProfileCompletenessSectionId(raw: string): ProfileCompletenessSectionId {
  const value = raw.trim();
  if (!isProfileCompletenessSectionId(value)) {
    throw new Error(`Unknown ProfileCompletenessSectionId: ${raw}`);
  }
  return value;
}
