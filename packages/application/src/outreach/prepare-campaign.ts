import {
  buildDeliveryIdempotencyKey,
  type Campaign,
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  campaignIdAsString,
  createCampaignRecipient,
  createDeliveryJob,
  DeliveryJobStatus,
  type Institution,
  institutionIdAsString,
} from "@eduatlas/domain";
import { assertOperationAllowed, type BillingProtectionRepository } from "../billing-protection";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import type { DeliveryJobRepository } from "../delivery/delivery-job-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { CampaignRepository } from "./campaign-repository";
import type { CampaignSegmentRepository } from "./campaign-segment-repository";
import { OutreachValidationError } from "./errors";
import { institutionMatchesSegment } from "./institution-matches-segment";

export type PrepareCampaignResult = Readonly<{
  /** Newly created recipients in this call. */
  readonly recipientCount: number;
  readonly skippedDuplicates: number;
  /** Total recipients after this call. */
  readonly totalRecipients: number;
  readonly targetLimit: number;
}>;

export type PrepareCampaignDependencies = Readonly<{
  readonly campaignRepository: CampaignRepository;
  readonly segmentRepository: CampaignSegmentRepository;
  readonly recipientRepository: CampaignRecipientRepository;
  readonly deliveryJobRepository: DeliveryJobRepository;
  readonly institutionRepository: InstitutionRepository;
  readonly config: OutreachDeliveryConfig;
  /** Platform warm-up stage cap (overrides config.warmupBatchSize when set). */
  readonly targetLimit?: number;
  readonly nextRecipientId?: () => string;
  readonly nextJobId?: () => string;
  /** Optional Phase 1 billing circuit breaker — fail-open when omitted. */
  readonly billingProtectionRepository?: BillingProtectionRepository | null;
}>;

let prepareSeq = 0;

function defaultId(prefix: string): string {
  prepareSeq += 1;
  return `${prefix}_${prepareSeq}_${Date.now().toString(36)}`;
}

/**
 * Incremental prepare: creates recipients/jobs up to targetLimit for a draft campaign.
 * Skips institutions that already have an idempotent DeliveryJob.
 */
export async function prepareCampaign(
  input: { campaignId: string; now: string },
  deps: PrepareCampaignDependencies,
): Promise<PrepareCampaignResult> {
  const campaign = await deps.campaignRepository.getById(input.campaignId.trim());
  if (!campaign) {
    throw new OutreachValidationError(`Campaign not found: ${input.campaignId}`);
  }
  if (campaign.status !== CampaignStatus.Draft) {
    throw new OutreachValidationError("Only draft campaigns can be prepared.");
  }

  const targetLimit = Math.max(1, deps.targetLimit ?? deps.config.warmupBatchSize);
  const campaignId = campaignIdAsString(campaign.id);
  const existingRecipients = await deps.recipientRepository.listByCampaignId(campaignId);
  if (existingRecipients.length >= targetLimit) {
    return Object.freeze({
      recipientCount: 0,
      skippedDuplicates: 0,
      totalRecipients: existingRecipients.length,
      targetLimit,
    });
  }

  const segment = await deps.segmentRepository.getById(campaign.segmentId);
  if (!segment) {
    throw new OutreachValidationError("Campaign segment is missing.");
  }

  await assertOperationAllowed("OUTREACH_PREPARE", {
    billingProtectionRepository: deps.billingProtectionRepository,
  });

  const page = await deps.institutionRepository.list({
    filters: {
      ...(segment.filters.cityId ? { cityId: segment.filters.cityId } : {}),
      ...(segment.filters.districtId ? { districtId: segment.filters.districtId } : {}),
      ...(segment.filters.primaryType
        ? { primaryType: segment.filters.primaryType as Institution["primaryType"] }
        : {}),
      ...(segment.filters.verification
        ? { verification: segment.filters.verification as Institution["verification"] }
        : {}),
    },
    pageSize: 500,
  });

  const existingInstitutionIds = new Set(existingRecipients.map((r) => r.institutionId));
  const matched = page.items.filter((inst) => institutionMatchesSegment(inst, segment));
  const slots = targetLimit - existingRecipients.length;
  const candidates = matched.filter(
    (inst) => !existingInstitutionIds.has(institutionIdAsString(inst.id)),
  );

  let recipientCount = 0;
  let skippedDuplicates = 0;

  for (const institution of candidates) {
    if (recipientCount >= slots) break;

    const institutionId = institutionIdAsString(institution.id);
    const email = institution.contact.email?.trim();
    if (!email) {
      skippedDuplicates += 1;
      continue;
    }

    const idempotencyKey = buildDeliveryIdempotencyKey({
      campaignId,
      institutionId,
      channel: campaign.channel,
    });
    const existingJob = await deps.deliveryJobRepository.getByIdempotencyKey(idempotencyKey);
    if (existingJob) {
      skippedDuplicates += 1;
      continue;
    }

    const recipientId = deps.nextRecipientId?.() ?? defaultId("crec");
    const recipient = createCampaignRecipient({
      id: recipientId,
      campaignId,
      institutionId,
      email,
      status: CampaignRecipientStatus.Queued,
      createdAt: input.now,
      updatedAt: input.now,
    });
    await deps.recipientRepository.save(recipient);

    const job = createDeliveryJob({
      id: deps.nextJobId?.() ?? defaultId("djob"),
      channel: campaign.channel ?? CampaignChannel.Email,
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
    recipientCount += 1;
  }

  return Object.freeze({
    recipientCount,
    skippedDuplicates,
    totalRecipients: existingRecipients.length + recipientCount,
    targetLimit,
  });
}

export function assertCampaignReadyForRun(campaign: Campaign): void {
  if (campaign.status !== CampaignStatus.Ready && campaign.status !== CampaignStatus.Paused) {
    throw new OutreachValidationError("Campaign must be ready (approved) or paused to run.");
  }
}
