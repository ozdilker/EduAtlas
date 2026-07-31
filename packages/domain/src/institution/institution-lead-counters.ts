import type { LeadStatus } from "../lead/lead-status";

export type InstitutionLeadCounters = Readonly<{
  /**
   * Total leads seen by the owner dashboard (including spam/closed).
   */
  readonly total: number;
  /**
   * Pending leads for the pipeline board (LeadStatus.New).
   */
  readonly pending: number;
  /**
   * Counts by lead status.
   */
  readonly byStatus: Readonly<{
    readonly new: number;
    readonly read: number;
    readonly contacted: number;
    readonly appointment: number;
    readonly enrolled: number;
    readonly lost: number;
    readonly closed: number;
    readonly spam: number;
  }>;
  /**
   * Counts by pipeline column (board left → right).
   */
  readonly byPipeline: Readonly<{
    readonly new: number;
    readonly contacted: number;
    readonly appointment: number;
    readonly enrolled: number;
    readonly lost: number;
  }>;
}>;

export function createEmptyInstitutionLeadCounters(): InstitutionLeadCounters {
  return Object.freeze({
    total: 0,
    pending: 0,
    byStatus: Object.freeze({
      new: 0,
      read: 0,
      contacted: 0,
      appointment: 0,
      enrolled: 0,
      lost: 0,
      closed: 0,
      spam: 0,
    }),
    byPipeline: Object.freeze({
      new: 0,
      contacted: 0,
      appointment: 0,
      enrolled: 0,
      lost: 0,
    }),
  });
}

