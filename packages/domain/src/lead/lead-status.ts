/**
 * Lead lifecycle status (DOMAIN-MODEL / PRD + owner pipeline stages).
 */
export enum LeadStatus {
  New = "new",
  Read = "read",
  Contacted = "contacted",
  Appointment = "appointment",
  Enrolled = "enrolled",
  Lost = "lost",
  Closed = "closed",
  Spam = "spam",
}

/**
 * Visual owner pipeline columns (Task-013). Order is board left → right.
 */
export const LEAD_PIPELINE_STATUSES = [
  LeadStatus.New,
  LeadStatus.Contacted,
  LeadStatus.Appointment,
  LeadStatus.Enrolled,
  LeadStatus.Lost,
] as const;

export type LeadPipelineStatus = (typeof LEAD_PIPELINE_STATUSES)[number];

const LEAD_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(LeadStatus));
const LEAD_PIPELINE_STATUS_VALUES: ReadonlySet<string> = new Set(LEAD_PIPELINE_STATUSES);

/**
 * Returns true when value is a known LeadStatus.
 */
export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUS_VALUES.has(value);
}

/**
 * Returns true when value is a pipeline board status.
 */
export function isLeadPipelineStatus(value: string): value is LeadPipelineStatus {
  return LEAD_PIPELINE_STATUS_VALUES.has(value);
}

/**
 * Parses a raw string into LeadStatus or throws.
 */
export function parseLeadStatus(raw: string): LeadStatus {
  const value = raw.trim();

  if (!isLeadStatus(value)) {
    throw new Error(`Unknown LeadStatus: ${raw}`);
  }

  return value;
}

/**
 * Parses a raw string into a pipeline LeadStatus or throws.
 */
export function parseLeadPipelineStatus(raw: string): LeadPipelineStatus {
  const value = raw.trim();

  if (!isLeadPipelineStatus(value)) {
    throw new Error(`Unknown LeadPipelineStatus: ${raw}`);
  }

  return value;
}
