import {
  CampaignChannel,
  parseCampaignChannel,
  type CampaignChannel as CampaignChannelType,
} from "./campaign-channel";
import { campaignIdAsString, createCampaignId, type CampaignId } from "./campaign-id";
import {
  type CampaignExecution,
  type CampaignLearnings,
  type CampaignPostSummary,
  type CampaignPreSendChecklist,
  emptyPreSendChecklist,
  mergePreSendChecklist,
} from "./campaign-kit";
import {
  CampaignStatus,
  parseCampaignStatus,
  type CampaignStatus as CampaignStatusType,
} from "./campaign-status";

export type CampaignRecipientSource = "segment" | "external_import" | "manual";

export type CampaignImportMeta = Readonly<{
  readonly fileName: string;
  readonly rowCount: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly duplicateEmailCount: number;
  readonly importedAt: string;
}>;

/** Optional city/district scope for external/manual recipient institution matching. */
export type CampaignRecipientMatchScope = Readonly<{
  readonly cityId?: string;
  readonly districtId?: string;
}>;

export type Campaign = Readonly<{
  readonly id: CampaignId;
  readonly name: string;
  readonly description?: string;
  readonly status: CampaignStatusType;
  readonly channel: CampaignChannelType;
  readonly templateId: string;
  readonly segmentId: string;
  /** Audience origin — segment (default) or Excel/CSV import. */
  readonly recipientSource?: CampaignRecipientSource;
  /** Metadata from the last successful external import prepare (file not stored). */
  readonly importMeta?: CampaignImportMeta;
  /** External/manual matching geography. Does not change segment audience filters. */
  readonly recipientMatchScope?: CampaignRecipientMatchScope;
  /** When set, overrides the linked template subject at preview/send time. */
  readonly subjectOverride?: string;
  /** Inbox preview text (preheader). */
  readonly preheader?: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly preSendChecklist?: CampaignPreSendChecklist;
  readonly execution?: CampaignExecution;
  readonly postSummary?: CampaignPostSummary;
  readonly learnings?: CampaignLearnings;
}>;

export type CreateCampaignInput = {
  id: string;
  name: string;
  description?: string;
  status?: CampaignStatusType | string;
  channel?: CampaignChannelType | string;
  templateId: string;
  segmentId: string;
  recipientSource?: CampaignRecipientSource;
  importMeta?: CampaignImportMeta;
  recipientMatchScope?: CampaignRecipientMatchScope;
  subjectOverride?: string;
  preheader?: string;
  createdAt: string;
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
  preSendChecklist?: CampaignPreSendChecklist;
  execution?: CampaignExecution;
  postSummary?: CampaignPostSummary;
  learnings?: CampaignLearnings;
};

/**
 * Creates an immutable outreach Campaign aggregate.
 */
export function createCampaign(input: CreateCampaignInput): Campaign {
  const name = input.name.trim();
  const description = input.description?.trim();
  const templateId = input.templateId.trim();
  const segmentId = input.segmentId.trim();
  const createdBy = input.createdBy.trim();
  const subjectOverride = input.subjectOverride?.trim();
  const preheader = input.preheader?.trim();
  const status =
    typeof input.status === "string"
      ? parseCampaignStatus(input.status)
      : (input.status ?? CampaignStatus.Draft);
  const channel =
    typeof input.channel === "string"
      ? parseCampaignChannel(input.channel)
      : (input.channel ?? CampaignChannel.Email);

  if (!name) throw new Error("Campaign.name is required.");
  if (!templateId) throw new Error("Campaign.templateId is required.");
  if (!segmentId) throw new Error("Campaign.segmentId is required.");
  if (!createdBy) throw new Error("Campaign.createdBy is required.");
  assertIso(input.createdAt, "createdAt");
  if (input.startedAt) assertIso(input.startedAt, "startedAt");
  if (input.completedAt) assertIso(input.completedAt, "completedAt");

  const preSendChecklist = input.preSendChecklist
    ? mergePreSendChecklist(emptyPreSendChecklist(), input.preSendChecklist)
    : undefined;
  const execution = normalizeExecution(input.execution);
  const postSummary = normalizePostSummary(input.postSummary);
  const learnings = normalizeLearnings(input.learnings);
  const recipientMatchScope = normalizeRecipientMatchScope(input.recipientMatchScope);

  return Object.freeze({
    id: createCampaignId(input.id),
    name,
    ...(description ? { description } : {}),
    status,
    channel,
    templateId,
    segmentId,
    ...(input.recipientSource ? { recipientSource: input.recipientSource } : {}),
    ...(input.importMeta ? { importMeta: normalizeImportMeta(input.importMeta) } : {}),
    ...(recipientMatchScope ? { recipientMatchScope } : {}),
    ...(subjectOverride ? { subjectOverride } : {}),
    ...(preheader ? { preheader } : {}),
    createdAt: input.createdAt,
    createdBy,
    ...(input.startedAt ? { startedAt: input.startedAt } : {}),
    ...(input.completedAt ? { completedAt: input.completedAt } : {}),
    ...(preSendChecklist ? { preSendChecklist } : {}),
    ...(execution ? { execution } : {}),
    ...(postSummary ? { postSummary } : {}),
    ...(learnings ? { learnings } : {}),
  });
}

export function campaignKey(campaign: Campaign): string {
  return campaignIdAsString(campaign.id);
}

export function normalizeRecipientMatchScope(
  scope: CampaignRecipientMatchScope | undefined,
): CampaignRecipientMatchScope | undefined {
  if (!scope) return undefined;
  const cityId = scope.cityId?.trim() || undefined;
  let districtId = scope.districtId?.trim() || undefined;
  if (cityId && districtId) {
    if (districtId === cityId) {
      districtId = undefined;
    } else if (!districtId.includes("-") && !districtId.startsWith(`${cityId}-`)) {
      districtId = `${cityId}-${districtId}`;
    }
  }
  if (!cityId && !districtId) return undefined;
  return Object.freeze({
    ...(cityId ? { cityId } : {}),
    ...(districtId ? { districtId } : {}),
  });
}

function normalizeImportMeta(meta: CampaignImportMeta): CampaignImportMeta {
  const fileName = meta.fileName.trim();
  if (!fileName) throw new Error("Campaign.importMeta.fileName is required.");
  assertIso(meta.importedAt, "importMeta.importedAt");
  return Object.freeze({
    fileName,
    rowCount: Math.max(0, Math.floor(meta.rowCount)),
    acceptedCount: Math.max(0, Math.floor(meta.acceptedCount)),
    rejectedCount: Math.max(0, Math.floor(meta.rejectedCount)),
    duplicateEmailCount: Math.max(0, Math.floor(meta.duplicateEmailCount)),
    importedAt: meta.importedAt,
  });
}

function normalizeExecution(
  execution: CampaignExecution | undefined,
): CampaignExecution | undefined {
  if (!execution) return undefined;
  const preparedAt = execution.preparedAt?.trim();
  const approvedAt = execution.approvedAt?.trim();
  const startedAt = execution.startedAt?.trim();
  const completedAt = execution.completedAt?.trim();
  const cancelledAt = execution.cancelledAt?.trim();
  const lastTestMailAt = execution.lastTestMailAt?.trim();
  const next: CampaignExecution = Object.freeze({
    ...(preparedAt ? { preparedAt } : {}),
    ...(approvedAt ? { approvedAt } : {}),
    ...(startedAt ? { startedAt } : {}),
    ...(completedAt ? { completedAt } : {}),
    ...(cancelledAt ? { cancelledAt } : {}),
    ...(lastTestMailAt ? { lastTestMailAt } : {}),
  });
  return Object.keys(next).length > 0 ? next : undefined;
}

function normalizePostSummary(
  summary: CampaignPostSummary | undefined,
): CampaignPostSummary | undefined {
  if (!summary) return undefined;
  return Object.freeze({
    recipientCount: Math.max(0, summary.recipientCount),
    sent: Math.max(0, summary.sent),
    failed: Math.max(0, summary.failed),
    bounced: Math.max(0, summary.bounced),
    claimed: Math.max(0, summary.claimed),
    premium: Math.max(0, summary.premium),
    ...(typeof summary.durationMs === "number" && summary.durationMs >= 0
      ? { durationMs: summary.durationMs }
      : {}),
  });
}

function normalizeLearnings(
  learnings: CampaignLearnings | undefined,
): CampaignLearnings | undefined {
  if (!learnings) return undefined;
  const notes = learnings.notes.trim();
  if (!notes) return undefined;
  const updatedAt = learnings.updatedAt?.trim();
  const updatedBy = learnings.updatedBy?.trim();
  return Object.freeze({
    notes,
    ...(updatedAt ? { updatedAt } : {}),
    ...(updatedBy ? { updatedBy } : {}),
  });
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Campaign.${field} must be a valid ISO timestamp.`);
  }
}
