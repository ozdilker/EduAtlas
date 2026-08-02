import {
  CampaignChannel,
  parseCampaignChannel,
  type CampaignChannel as CampaignChannelType,
} from "../outreach/campaign-channel";
import { buildDeliveryIdempotencyKey } from "./delivery-idempotency";
import {
  DeliveryJobStatus,
  parseDeliveryJobStatus,
  type DeliveryJobStatus as DeliveryJobStatusType,
} from "./delivery-job-status";

export type DeliveryJob = Readonly<{
  readonly id: string;
  readonly channel: CampaignChannelType;
  readonly campaignId: string;
  readonly recipientId: string;
  readonly institutionId: string;
  readonly status: DeliveryJobStatusType;
  readonly idempotencyKey: string;
  readonly attemptCount: number;
  readonly maxAttempts: number;
  readonly availableAt: string;
  readonly lockedAt?: string;
  readonly lockedBy?: string;
  readonly lastError?: string;
  readonly smtpMessageId?: string;
  readonly smtpResponse?: string;
  readonly smtpCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type CreateDeliveryJobInput = {
  id: string;
  channel?: CampaignChannelType | string;
  campaignId: string;
  recipientId: string;
  institutionId: string;
  status?: DeliveryJobStatusType | string;
  idempotencyKey?: string;
  attemptCount?: number;
  maxAttempts?: number;
  availableAt: string;
  lockedAt?: string;
  lockedBy?: string;
  lastError?: string;
  smtpMessageId?: string;
  smtpResponse?: string;
  smtpCode?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Creates an immutable channel-agnostic DeliveryJob.
 */
export function createDeliveryJob(input: CreateDeliveryJobInput): DeliveryJob {
  const id = input.id.trim();
  const campaignId = input.campaignId.trim();
  const recipientId = input.recipientId.trim();
  const institutionId = input.institutionId.trim();
  const channel =
    typeof input.channel === "string"
      ? parseCampaignChannel(input.channel)
      : (input.channel ?? CampaignChannel.Email);
  const status =
    typeof input.status === "string"
      ? parseDeliveryJobStatus(input.status)
      : (input.status ?? DeliveryJobStatus.Pending);
  const attemptCount = input.attemptCount ?? 0;
  const maxAttempts = input.maxAttempts ?? 3;
  const lastError = input.lastError?.trim();
  const lockedBy = input.lockedBy?.trim();
  const smtpMessageId = input.smtpMessageId?.trim();
  const smtpResponse = input.smtpResponse?.trim();
  const smtpCode = input.smtpCode?.trim();
  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    buildDeliveryIdempotencyKey({ campaignId, institutionId, channel });

  if (!id) throw new Error("DeliveryJob.id is required.");
  if (!campaignId) throw new Error("DeliveryJob.campaignId is required.");
  if (!recipientId) throw new Error("DeliveryJob.recipientId is required.");
  if (!institutionId) throw new Error("DeliveryJob.institutionId is required.");
  if (!Number.isInteger(attemptCount) || attemptCount < 0) {
    throw new Error("DeliveryJob.attemptCount must be a non-negative integer.");
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("DeliveryJob.maxAttempts must be a positive integer.");
  }
  assertIso(input.availableAt, "availableAt");
  assertIso(input.createdAt, "createdAt");
  assertIso(input.updatedAt, "updatedAt");
  if (input.lockedAt) assertIso(input.lockedAt, "lockedAt");

  return Object.freeze({
    id,
    channel,
    campaignId,
    recipientId,
    institutionId,
    status,
    idempotencyKey,
    attemptCount,
    maxAttempts,
    availableAt: input.availableAt,
    ...(input.lockedAt ? { lockedAt: input.lockedAt } : {}),
    ...(lockedBy ? { lockedBy } : {}),
    ...(lastError ? { lastError } : {}),
    ...(smtpMessageId ? { smtpMessageId } : {}),
    ...(smtpResponse ? { smtpResponse } : {}),
    ...(smtpCode ? { smtpCode } : {}),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`DeliveryJob.${field} must be a valid ISO timestamp.`);
  }
}
