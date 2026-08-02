export const CampaignRecipientStatus = Object.freeze({
  Pending: "pending",
  Queued: "queued",
  Sent: "sent",
  Delivered: "delivered",
  Opened: "opened",
  Clicked: "clicked",
  Claimed: "claimed",
  Failed: "failed",
  Bounced: "bounced",
  Unsubscribed: "unsubscribed",
} as const);

export type CampaignRecipientStatus =
  (typeof CampaignRecipientStatus)[keyof typeof CampaignRecipientStatus];

export function isCampaignRecipientStatus(value: string): value is CampaignRecipientStatus {
  return Object.values(CampaignRecipientStatus).includes(value as CampaignRecipientStatus);
}

export function parseCampaignRecipientStatus(raw: string): CampaignRecipientStatus {
  const value = raw.trim();
  if (!isCampaignRecipientStatus(value)) {
    throw new Error(`Unknown CampaignRecipientStatus: ${raw}`);
  }
  return value;
}
