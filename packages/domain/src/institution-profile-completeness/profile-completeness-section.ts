import {
  isProfileCompletenessSectionId,
  type ProfileCompletenessSectionId,
  parseProfileCompletenessSectionId,
} from "./profile-completeness-section-id";

/**
 * One weighted section in the Institution Profile Completeness Engine.
 */
export type ProfileCompletenessSection = Readonly<{
  readonly id: ProfileCompletenessSectionId;
  readonly label: string;
  readonly weight: number;
  readonly completed: boolean;
  readonly hint: string;
}>;

export type CreateProfileCompletenessSectionInput = {
  id: ProfileCompletenessSectionId | string;
  label: string;
  weight: number;
  completed: boolean;
  hint: string;
};

/**
 * Creates an immutable profile completeness section.
 */
export function createProfileCompletenessSection(
  input: CreateProfileCompletenessSectionInput,
): ProfileCompletenessSection {
  const id = typeof input.id === "string" ? parseProfileCompletenessSectionId(input.id) : input.id;
  const label = input.label.trim();
  const hint = input.hint.trim();

  if (!label) {
    throw new Error("ProfileCompletenessSection.label is required.");
  }
  if (!hint) {
    throw new Error("ProfileCompletenessSection.hint is required.");
  }
  if (!Number.isFinite(input.weight) || input.weight <= 0) {
    throw new Error("ProfileCompletenessSection.weight must be a positive number.");
  }

  return Object.freeze({
    id,
    label,
    weight: input.weight,
    completed: Boolean(input.completed),
    hint,
  });
}

export { isProfileCompletenessSectionId, parseProfileCompletenessSectionId };
