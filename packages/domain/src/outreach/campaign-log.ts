import {
  CampaignLogLevel,
  parseCampaignLogLevel,
  type CampaignLogLevel as CampaignLogLevelType,
} from "./campaign-log-level";

export type CampaignLog = Readonly<{
  readonly id: string;
  readonly campaignId: string;
  readonly level: CampaignLogLevelType;
  readonly message: string;
  readonly at: string;
  readonly meta?: Readonly<Record<string, string>>;
}>;

export type CreateCampaignLogInput = {
  id: string;
  campaignId: string;
  level?: CampaignLogLevelType | string;
  message: string;
  at: string;
  meta?: Readonly<Record<string, string>>;
};

/**
 * Creates an immutable campaign audit log entry.
 */
export function createCampaignLog(input: CreateCampaignLogInput): CampaignLog {
  const id = input.id.trim();
  const campaignId = input.campaignId.trim();
  const message = input.message.trim();
  const level =
    typeof input.level === "string"
      ? parseCampaignLogLevel(input.level)
      : (input.level ?? CampaignLogLevel.Info);

  if (!id) throw new Error("CampaignLog.id is required.");
  if (!campaignId) throw new Error("CampaignLog.campaignId is required.");
  if (!message) throw new Error("CampaignLog.message is required.");
  if (Number.isNaN(Date.parse(input.at))) {
    throw new Error("CampaignLog.at must be a valid ISO timestamp.");
  }

  const meta = input.meta
    ? Object.freeze(
        Object.fromEntries(
          Object.entries(input.meta)
            .map(([k, v]) => [k.trim(), String(v).trim()] as const)
            .filter(([k, v]) => k && v),
        ),
      )
    : undefined;

  return Object.freeze({
    id,
    campaignId,
    level,
    message,
    at: input.at,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  });
}
