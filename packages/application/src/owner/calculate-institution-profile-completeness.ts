import {
  createInstitutionId,
  evaluateInstitutionProfileCompleteness,
  type InstitutionProfileCompleteness,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";

export type CalculateInstitutionProfileCompletenessInput = {
  institutionId: string;
};

export type CalculateInstitutionProfileCompletenessDependencies = {
  institutionRepository: InstitutionRepository;
};

/**
 * Application service: weighted Institution Profile Completeness Engine.
 * Foundation for future Growth Score — not Growth Score. No AI / LLM.
 */
export async function calculateInstitutionProfileCompleteness(
  input: CalculateInstitutionProfileCompletenessInput,
  deps: CalculateInstitutionProfileCompletenessDependencies,
): Promise<InstitutionProfileCompleteness | null> {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    return null;
  }

  const institution = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    return null;
  }

  return evaluateInstitutionProfileCompleteness(institution);
}
