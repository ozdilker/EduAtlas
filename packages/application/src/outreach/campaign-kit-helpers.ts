import {
  CampaignRecipientStatus,
  DeliveryJobStatus,
  type Campaign,
  type CampaignPostSummary,
  type CampaignRecipient,
  type DeliveryJob,
} from "@eduatlas/domain";
import { computeCampaignProgress } from "./campaign-progress";

export type RecipientChecklistItem = Readonly<{
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly detail?: string;
}>;

export type RecipientChecklistResult = Readonly<{
  readonly items: readonly RecipientChecklistItem[];
  readonly allOk: boolean;
}>;

/**
 * Auto checks shown after Prepare (derived; not persisted).
 */
export function buildRecipientChecklist(input: {
  recipients: readonly CampaignRecipient[];
  warmupLimit: number;
}): RecipientChecklistResult {
  const { recipients, warmupLimit } = input;
  const withEmail = recipients.every((r) => Boolean(r.email?.trim()));
  const unclaimedLike = recipients.every(
    (r) =>
      r.status !== CampaignRecipientStatus.Claimed &&
      !r.claimedAt,
  );
  const ids = recipients.map((r) => r.institutionId);
  const unique = new Set(ids);
  const noDuplicate = unique.size === ids.length;
  const withinWarmup = recipients.length > 0 && recipients.length <= warmupLimit;

  const items: RecipientChecklistItem[] = [
    {
      id: "email",
      label: "Mail var",
      ok: recipients.length > 0 && withEmail,
      detail: `${recipients.length} recipient`,
    },
    {
      id: "unclaimed",
      label: "Claim edilmemiş",
      ok: recipients.length > 0 && unclaimedLike,
    },
    {
      id: "duplicate",
      label: "Duplicate değil",
      ok: recipients.length > 0 && noDuplicate,
    },
    {
      id: "warmup",
      label: "Warm-up limitine uygun",
      ok: withinWarmup,
      detail: `${recipients.length}/${warmupLimit}`,
    },
  ];

  return Object.freeze({
    items: Object.freeze(items),
    allOk: items.every((i) => i.ok),
  });
}

/**
 * Builds post-campaign summary from jobs + recipients.
 */
export function buildCampaignPostSummary(input: {
  campaign: Campaign;
  jobs: readonly DeliveryJob[];
  recipients: readonly CampaignRecipient[];
  completedAt: string;
  premiumCount?: number;
}): CampaignPostSummary {
  const progress = computeCampaignProgress(input.jobs);
  const claimed = input.recipients.filter(
    (r) => r.status === CampaignRecipientStatus.Claimed || Boolean(r.claimedAt),
  ).length;
  const started =
    input.campaign.execution?.startedAt ??
    input.campaign.startedAt ??
    input.campaign.createdAt;
  const durationMs = Math.max(
    0,
    Date.parse(input.completedAt) - Date.parse(started),
  );
  const cancelled = input.jobs.filter((j) => j.status === DeliveryJobStatus.Cancelled)
    .length;
  void cancelled;

  return Object.freeze({
    recipientCount: input.recipients.length,
    sent: progress.sent,
    failed: progress.failed,
    bounced: progress.bounced,
    claimed,
    premium: Math.max(0, input.premiumCount ?? 0),
    ...(Number.isFinite(durationMs) ? { durationMs } : {}),
  });
}
