export const CampaignStatus = Object.freeze({
  Draft: "draft",
  Ready: "ready",
  Running: "running",
  Paused: "paused",
  Completed: "completed",
  Cancelled: "cancelled",
  Failed: "failed",
} as const);

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export function isCampaignStatus(value: string): value is CampaignStatus {
  return Object.values(CampaignStatus).includes(value as CampaignStatus);
}

export function parseCampaignStatus(raw: string): CampaignStatus {
  const value = raw.trim();
  if (!isCampaignStatus(value)) {
    throw new Error(`Unknown CampaignStatus: ${raw}`);
  }
  return value;
}
