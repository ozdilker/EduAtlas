import {
  CampaignRecipientStatus,
  CampaignStatus,
  campaignIdAsString,
  createCampaignLog,
  CampaignLogLevel,
  type CampaignRecipient,
} from "@eduatlas/domain";
import type { DeliveryJobRepository } from "../delivery/delivery-job-repository";
import type { CampaignLogRepository } from "./campaign-log-repository";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { CampaignRepository } from "./campaign-repository";
import { OutreachNotFoundError, OutreachValidationError } from "./errors";

export const RECIPIENT_REMOVAL_REASON = Object.freeze({
  ClosedInstitution: "closed institution",
  UnverifiedInstitution: "institution could not be verified",
} as const);

export type RecipientRemovalReason =
  (typeof RECIPIENT_REMOVAL_REASON)[keyof typeof RECIPIENT_REMOVAL_REASON];

export type RemoveCampaignRecipientInput = Readonly<{
  readonly campaignId: string;
  readonly recipientId: string;
  readonly reason: RecipientRemovalReason | string;
  readonly now: string;
}>;

export type RemoveCampaignRecipientResult = Readonly<{
  readonly recipientId: string;
  readonly displayName: string;
  readonly email: string;
  readonly previousStatus: string;
  readonly reason: string;
}>;

export type RemoveCampaignRecipientDependencies = Readonly<{
  readonly campaignRepository: CampaignRepository;
  readonly recipientRepository: CampaignRecipientRepository;
  readonly logRepository: CampaignLogRepository;
  readonly deliveryJobRepository?: DeliveryJobRepository | null;
  readonly nextLogId?: () => string;
}>;

/**
 * GROWTH-009: removes a recipient from the active send set by deleting the
 * CampaignRecipient document (no excluded status in domain).
 *
 * Safety:
 * - Only Pending recipients may be removed (never queued/sent).
 * - Refuses when a DeliveryJob already exists for the recipient.
 * - Does not alter campaign status, importMeta, or other recipients' jobs.
 * - Writes an audit campaign log with name, email, and reason.
 */
export async function removeCampaignRecipient(
  input: RemoveCampaignRecipientInput,
  deps: RemoveCampaignRecipientDependencies,
): Promise<RemoveCampaignRecipientResult> {
  const campaignId = input.campaignId.trim();
  const recipientId = input.recipientId.trim();
  const reason = input.reason.trim();
  if (!campaignId) throw new OutreachValidationError("campaignId is required.");
  if (!recipientId) throw new OutreachValidationError("recipientId is required.");
  if (!reason) throw new OutreachValidationError("Removal reason is required.");

  const campaign = await deps.campaignRepository.getById(campaignId);
  if (!campaign) {
    throw new OutreachNotFoundError(`Campaign not found: ${campaignId}`);
  }
  if (campaign.status === CampaignStatus.Running) {
    throw new OutreachValidationError(
      "Running kampanyadan alıcı çıkarılamaz. Önce pause edin.",
    );
  }

  const recipient = await deps.recipientRepository.getById(recipientId);
  if (!recipient || recipient.campaignId !== campaignIdAsString(campaign.id)) {
    throw new OutreachNotFoundError(
      `Campaign recipient not found: ${recipientId} (campaign ${campaignId})`,
    );
  }

  if (recipient.status !== CampaignRecipientStatus.Pending) {
    throw new OutreachValidationError(
      `Yalnızca Pending alıcılar çıkarılabilir (mevcut: ${recipient.status}). Queued/sent alıcılara dokunulmaz.`,
    );
  }

  if (deps.deliveryJobRepository) {
    const jobs = await deps.deliveryJobRepository.listByCampaignId(campaignId);
    const linked = jobs.filter((j) => j.recipientId === recipient.id);
    if (linked.length > 0) {
      throw new OutreachValidationError(
        `Alıcının DeliveryJob kaydı var (${linked.length}). Job'lara dokunulmadan recipient silinemez.`,
      );
    }
  }

  await deps.recipientRepository.deleteById(recipient.id);

  const displayName = recipient.displayName?.trim() || recipient.institutionId;
  const email = recipient.email.trim();
  const logId =
    deps.nextLogId?.() ??
    `clog_rm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  await deps.logRepository.save(
    createCampaignLog({
      id: logId,
      campaignId,
      level: CampaignLogLevel.Info,
      message: `recipient removed from campaign: ${displayName} <${email}> — ${reason}`,
      at: input.now,
      meta: {
        action: "recipient_removed",
        recipientId: recipient.id,
        displayName,
        email,
        reason,
        previousStatus: recipient.status,
        institutionMatch: recipient.institutionMatch ?? "",
      },
    }),
  );

  return Object.freeze({
    recipientId: recipient.id,
    displayName,
    email,
    previousStatus: recipient.status,
    reason,
  });
}

export function isClaimBlockedRecipient(recipient: CampaignRecipient): boolean {
  return (
    recipient.institutionMatch === "unmatched" ||
    recipient.institutionMatch === "ambiguous"
  );
}
