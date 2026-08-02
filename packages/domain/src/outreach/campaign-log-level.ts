export const CampaignLogLevel = Object.freeze({
  Info: "info",
  Warn: "warn",
  Error: "error",
} as const);

export type CampaignLogLevel = (typeof CampaignLogLevel)[keyof typeof CampaignLogLevel];

export function isCampaignLogLevel(value: string): value is CampaignLogLevel {
  return Object.values(CampaignLogLevel).includes(value as CampaignLogLevel);
}

export function parseCampaignLogLevel(raw: string): CampaignLogLevel {
  const value = raw.trim();
  if (!isCampaignLogLevel(value)) {
    throw new Error(`Unknown CampaignLogLevel: ${raw}`);
  }
  return value;
}
