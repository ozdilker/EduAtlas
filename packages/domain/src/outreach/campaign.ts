import {
  CampaignChannel,
  parseCampaignChannel,
  type CampaignChannel as CampaignChannelType,
} from "./campaign-channel";
import { campaignIdAsString, createCampaignId, type CampaignId } from "./campaign-id";
import {
  CampaignStatus,
  parseCampaignStatus,
  type CampaignStatus as CampaignStatusType,
} from "./campaign-status";

export type Campaign = Readonly<{
  readonly id: CampaignId;
  readonly name: string;
  readonly description?: string;
  readonly status: CampaignStatusType;
  readonly channel: CampaignChannelType;
  readonly templateId: string;
  readonly segmentId: string;
  /** When set, overrides the linked template subject at preview/send time. */
  readonly subjectOverride?: string;
  /** Inbox preview text (preheader). */
  readonly preheader?: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
}>;

export type CreateCampaignInput = {
  id: string;
  name: string;
  description?: string;
  status?: CampaignStatusType | string;
  channel?: CampaignChannelType | string;
  templateId: string;
  segmentId: string;
  subjectOverride?: string;
  preheader?: string;
  createdAt: string;
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
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

  return Object.freeze({
    id: createCampaignId(input.id),
    name,
    ...(description ? { description } : {}),
    status,
    channel,
    templateId,
    segmentId,
    ...(subjectOverride ? { subjectOverride } : {}),
    ...(preheader ? { preheader } : {}),
    createdAt: input.createdAt,
    createdBy,
    ...(input.startedAt ? { startedAt: input.startedAt } : {}),
    ...(input.completedAt ? { completedAt: input.completedAt } : {}),
  });
}

export function campaignKey(campaign: Campaign): string {
  return campaignIdAsString(campaign.id);
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Campaign.${field} must be a valid ISO timestamp.`);
  }
}
