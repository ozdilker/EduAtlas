import { LEAD_PIPELINE_STATUSES, type Lead, type LeadPipelineStatus } from "@eduatlas/domain";
import type { LeadRepository } from "../leads/lead-repository";

export type OwnerLeadPipelineColumn = Readonly<{
  readonly status: LeadPipelineStatus;
  readonly leads: readonly Lead[];
  readonly count: number;
}>;

export type OwnerLeadPipeline = Readonly<{
  readonly institutionId: string;
  readonly columns: readonly OwnerLeadPipelineColumn[];
  readonly totalInPipeline: number;
}>;

export type GetOwnerLeadPipelineInput = {
  institutionId: string;
};

export type GetOwnerLeadPipelineDependencies = {
  leadRepository: LeadRepository;
};

/**
 * Application service: group institution leads into the visual pipeline board.
 */
export async function getOwnerLeadPipeline(
  input: GetOwnerLeadPipelineInput,
  deps: GetOwnerLeadPipelineDependencies,
): Promise<OwnerLeadPipeline> {
  const institutionId = input.institutionId.trim();
  const leads = institutionId ? await deps.leadRepository.listByInstitutionId(institutionId) : [];

  const columns = LEAD_PIPELINE_STATUSES.map((status) => {
    const columnLeads = leads.filter((lead) => lead.status === status);
    return Object.freeze({
      status,
      leads: Object.freeze(columnLeads),
      count: columnLeads.length,
    });
  });

  return Object.freeze({
    institutionId,
    columns: Object.freeze(columns),
    totalInPipeline: columns.reduce((sum, column) => sum + column.count, 0),
  });
}
