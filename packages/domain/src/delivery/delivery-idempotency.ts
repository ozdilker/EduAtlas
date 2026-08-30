import type { CampaignChannel } from "../outreach/campaign-channel";

/**
 * Stable idempotency key for a delivery attempt target.
 *
 * - Segment / institution-scoped: `${campaignId}:${institutionId}:${channel}`
 * - External/manual recipient-scoped (GROWTH-010 B1):
 *   `${campaignId}:${recipientId}:${channel}`
 */
export function buildDeliveryIdempotencyKey(input: {
  campaignId: string;
  channel: CampaignChannel | string;
  institutionId?: string;
  recipientId?: string;
}): string {
  const campaignId = input.campaignId.trim();
  const channel = String(input.channel).trim().toLowerCase();
  const recipientId = input.recipientId?.trim() ?? "";
  const institutionId = input.institutionId?.trim() ?? "";
  if (!campaignId || !channel) {
    throw new Error("Delivery idempotency key requires campaignId and channel.");
  }
  if (recipientId) {
    return `${campaignId}:${recipientId}:${channel}`;
  }
  if (!institutionId) {
    throw new Error(
      "Delivery idempotency key requires institutionId when recipientId is omitted.",
    );
  }
  return `${campaignId}:${institutionId}:${channel}`;
}

/** External/manual prepare: one DeliveryJob per CampaignRecipient. */
export function buildRecipientDeliveryIdempotencyKey(input: {
  campaignId: string;
  recipientId: string;
  channel: CampaignChannel | string;
}): string {
  return buildDeliveryIdempotencyKey({
    campaignId: input.campaignId,
    recipientId: input.recipientId,
    channel: input.channel,
  });
}
