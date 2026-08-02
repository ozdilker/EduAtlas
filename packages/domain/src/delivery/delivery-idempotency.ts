import type { CampaignChannel } from "../outreach/campaign-channel";

/**
 * Stable idempotency key for a delivery attempt target.
 * Format: `${campaignId}:${institutionId}:${channel}`
 */
export function buildDeliveryIdempotencyKey(input: {
  campaignId: string;
  institutionId: string;
  channel: CampaignChannel | string;
}): string {
  const campaignId = input.campaignId.trim();
  const institutionId = input.institutionId.trim();
  const channel = String(input.channel).trim().toLowerCase();
  if (!campaignId || !institutionId || !channel) {
    throw new Error("Delivery idempotency key requires campaignId, institutionId, and channel.");
  }
  return `${campaignId}:${institutionId}:${channel}`;
}
