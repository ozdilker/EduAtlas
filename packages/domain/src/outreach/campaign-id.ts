const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export type CampaignId = Readonly<{ readonly value: string }>;

export function createCampaignId(raw: string): CampaignId {
  const value = raw.trim();
  if (!ID_PATTERN.test(value)) {
    throw new Error("CampaignId must be 1–128 URL-safe characters.");
  }
  return Object.freeze({ value });
}

export function campaignIdAsString(id: CampaignId): string {
  return id.value;
}
