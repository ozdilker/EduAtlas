import {
  createLeadId,
  type Lead,
  type LeadId,
  type LeadPipelineStatus,
  parseLeadPipelineStatus,
} from "@eduatlas/domain";
import { LeadNotFoundError, LeadValidationError } from "./errors";
import type { LeadRepository } from "./lead-repository";

export type UpdateLeadStatusInput = {
  leadId: string;
  status: string;
  /** When set, lead must belong to this institution (owner scope). */
  institutionId?: string;
};

export type UpdateLeadStatusResult = Readonly<{
  readonly lead: Lead;
}>;

export type UpdateLeadStatusDependencies = {
  leadRepository: LeadRepository;
};

/**
 * Application service: update a lead's pipeline/lifecycle status via repository.
 * No CRM, reminders, or notifications.
 */
export async function updateLeadStatus(
  input: UpdateLeadStatusInput,
  deps: UpdateLeadStatusDependencies,
): Promise<UpdateLeadStatusResult> {
  const leadIdRaw = input.leadId.trim();
  if (!leadIdRaw) {
    throw new LeadValidationError("Lead.id is required.");
  }

  let status: LeadPipelineStatus;
  try {
    status = parseLeadPipelineStatus(input.status);
  } catch (error) {
    throw new LeadValidationError(error instanceof Error ? error.message : "Invalid lead status.");
  }

  let leadId: LeadId;
  try {
    leadId = createLeadId(leadIdRaw);
  } catch (error) {
    throw new LeadValidationError(error instanceof Error ? error.message : "Invalid lead id.");
  }

  const existing = await deps.leadRepository.getById(leadId);
  if (!existing) {
    throw new LeadNotFoundError(leadIdRaw);
  }

  const expectedInstitutionId = input.institutionId?.trim();
  if (expectedInstitutionId && existing.institutionId.value !== expectedInstitutionId) {
    throw new LeadValidationError("Lead does not belong to this institution.");
  }

  const updated = await deps.leadRepository.updateStatus(leadId, status);
  return Object.freeze({ lead: updated });
}
