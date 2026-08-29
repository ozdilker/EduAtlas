import {
  buildDeliveryIdempotencyKey,
  type Campaign,
  type CampaignRecipient,
  CampaignChannel,
  CampaignRecipientStatus,
  campaignIdAsString,
  createCampaignRecipient,
  createDeliveryJob,
  DeliveryJobStatus,
} from "@eduatlas/domain";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import type { DeliveryJobRepository } from "../delivery/delivery-job-repository";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { PrepareCampaignResult } from "./prepare-campaign";

export type PreparedTarget = Readonly<{
  readonly institutionId: string;
  readonly email: string;
  readonly displayName?: string;
}>;

export type EnqueuePreparedTargetsInput = Readonly<{
  readonly campaign: Campaign;
  readonly now: string;
  readonly targets: readonly PreparedTarget[];
  readonly targetLimit: number;
  readonly existingRecipientInstitutionIds: ReadonlySet<string>;
  readonly existingRecipientCount: number;
}>;

export type EnqueuePreparedTargetsDependencies = Readonly<{
  readonly recipientRepository: CampaignRecipientRepository;
  readonly deliveryJobRepository: DeliveryJobRepository;
  readonly config: OutreachDeliveryConfig;
  readonly nextRecipientId?: () => string;
  readonly nextJobId?: () => string;
}>;

let enqueueSeq = 0;

function defaultId(prefix: string): string {
  enqueueSeq += 1;
  return `${prefix}_${enqueueSeq}_${Date.now().toString(36)}`;
}

/**
 * Creates Queued recipients + Pending DeliveryJobs up to remaining warm-up slots.
 * Shared by segment prepare and external import prepare.
 */
export async function enqueuePreparedTargets(
  input: EnqueuePreparedTargetsInput,
  deps: EnqueuePreparedTargetsDependencies,
): Promise<PrepareCampaignResult> {
  const campaignId = campaignIdAsString(input.campaign.id);
  const slots = Math.max(0, input.targetLimit - input.existingRecipientCount);
  if (slots === 0) {
    return Object.freeze({
      recipientCount: 0,
      skippedDuplicates: 0,
      totalRecipients: input.existingRecipientCount,
      targetLimit: input.targetLimit,
    });
  }

  let recipientCount = 0;
  let skippedDuplicates = 0;
  const seenInBatch = new Set(input.existingRecipientInstitutionIds);

  for (const target of input.targets) {
    if (recipientCount >= slots) break;

    const institutionId = target.institutionId.trim();
    const email = target.email.trim().toLowerCase();
    if (!institutionId || !email || !email.includes("@")) {
      skippedDuplicates += 1;
      continue;
    }
    if (seenInBatch.has(institutionId)) {
      skippedDuplicates += 1;
      continue;
    }

    const idempotencyKey = buildDeliveryIdempotencyKey({
      campaignId,
      institutionId,
      channel: input.campaign.channel,
    });
    const existingJob = await deps.deliveryJobRepository.getByIdempotencyKey(idempotencyKey);
    if (existingJob) {
      skippedDuplicates += 1;
      continue;
    }

    const recipientId = deps.nextRecipientId?.() ?? defaultId("crec");
    const displayName = target.displayName?.trim();
    const recipient = createCampaignRecipient({
      id: recipientId,
      campaignId,
      institutionId,
      email,
      ...(displayName ? { displayName } : {}),
      status: CampaignRecipientStatus.Queued,
      createdAt: input.now,
      updatedAt: input.now,
    });
    await deps.recipientRepository.save(recipient);

    const job = createDeliveryJob({
      id: deps.nextJobId?.() ?? defaultId("djob"),
      channel: input.campaign.channel ?? CampaignChannel.Email,
      campaignId,
      recipientId,
      institutionId,
      status: DeliveryJobStatus.Pending,
      idempotencyKey,
      attemptCount: 0,
      maxAttempts: deps.config.maxAttempts,
      availableAt: input.now,
      createdAt: input.now,
      updatedAt: input.now,
    });
    await deps.deliveryJobRepository.save(job);

    seenInBatch.add(institutionId);
    recipientCount += 1;
  }

  return Object.freeze({
    recipientCount,
    skippedDuplicates,
    totalRecipients: input.existingRecipientCount + recipientCount,
    targetLimit: input.targetLimit,
  });
}

export type PromotePendingRecipientsInput = Readonly<{
  readonly campaign: Campaign;
  readonly now: string;
  readonly recipients: readonly CampaignRecipient[];
  readonly targetLimit: number;
}>;

/**
 * Promotes existing Pending (matched) CampaignRecipients to Queued + Pending DeliveryJobs.
 * Used after external import persistence — does not create new recipient rows.
 */
export async function promotePendingRecipientsToJobs(
  input: PromotePendingRecipientsInput,
  deps: EnqueuePreparedTargetsDependencies,
): Promise<PrepareCampaignResult> {
  const campaignId = campaignIdAsString(input.campaign.id);
  const alreadyPrepared = input.recipients.filter(
    (r) => r.status !== CampaignRecipientStatus.Pending,
  ).length;
  const slots = Math.max(0, input.targetLimit - alreadyPrepared);
  if (slots === 0) {
    return Object.freeze({
      recipientCount: 0,
      skippedDuplicates: 0,
      totalRecipients: input.recipients.length,
      targetLimit: input.targetLimit,
    });
  }

  let recipientCount = 0;
  let skippedDuplicates = 0;

  for (const recipient of input.recipients) {
    if (recipientCount >= slots) break;
    if (recipient.status !== CampaignRecipientStatus.Pending) {
      continue;
    }
    // Unmatched (ext:) rows are allowed: personalization uses displayName and CTA
    // stays the shared login URL — never invent a catalog claim link for them.

    const institutionId = recipient.institutionId.trim();
    const idempotencyKey = buildDeliveryIdempotencyKey({
      campaignId,
      institutionId,
      channel: input.campaign.channel,
    });
    const existingJob = await deps.deliveryJobRepository.getByIdempotencyKey(idempotencyKey);
    if (existingJob) {
      skippedDuplicates += 1;
      continue;
    }

    const job = createDeliveryJob({
      id: deps.nextJobId?.() ?? defaultId("djob"),
      channel: input.campaign.channel ?? CampaignChannel.Email,
      campaignId,
      recipientId: recipient.id,
      institutionId,
      status: DeliveryJobStatus.Pending,
      idempotencyKey,
      attemptCount: 0,
      maxAttempts: deps.config.maxAttempts,
      availableAt: input.now,
      createdAt: input.now,
      updatedAt: input.now,
    });
    await deps.deliveryJobRepository.save(job);

    await deps.recipientRepository.update(
      createCampaignRecipient({
        ...recipient,
        status: CampaignRecipientStatus.Queued,
        updatedAt: input.now,
      }),
    );
    recipientCount += 1;
  }

  return Object.freeze({
    recipientCount,
    skippedDuplicates,
    totalRecipients: alreadyPrepared + recipientCount,
    targetLimit: input.targetLimit,
  });
}
