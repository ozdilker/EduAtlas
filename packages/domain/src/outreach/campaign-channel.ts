/**
 * Outreach delivery channel. Only `email` is used in PRD-OUTREACH-001;
 * other values reserve the architecture for later PRDs.
 */
export const CampaignChannel = Object.freeze({
  Email: "email",
  Sms: "sms",
  Whatsapp: "whatsapp",
  Push: "push",
} as const);

export type CampaignChannel = (typeof CampaignChannel)[keyof typeof CampaignChannel];

export function isCampaignChannel(value: string): value is CampaignChannel {
  return Object.values(CampaignChannel).includes(value as CampaignChannel);
}

export function parseCampaignChannel(raw: string): CampaignChannel {
  const value = raw.trim();
  if (!isCampaignChannel(value)) {
    throw new Error(`Unknown CampaignChannel: ${raw}`);
  }
  return value;
}
