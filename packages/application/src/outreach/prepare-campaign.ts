import {
  buildDeliveryIdempotencyKey,
  campaignIdAsString,
  CampaignChannel,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaignRecipient,
  createDeliveryJob,
  DeliveryJobStatus,
  institutionIdAsString,
  type Campaign,
  type Institution,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import type { DeliveryJobRepository } from "../delivery/delivery-job-repository";
import { OutreachValidationError } from "./errors";
import { institutionMatchesSegment } from "./institution-matches-segment";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { CampaignRepository } from "./campaign-repository";
import type { CampaignSegmentRepository } from "./campaign-segment-repository";

export type PrepareCampaignResult = Readonly<{
  readonly recipientCount: number;
  readonly skippedDuplicates: number;
}>;

export type PrepareCampaignDependencies = Readonly<{
  readonly campaignRepository: CampaignRepository;
  readonly segmentRepository: CampaignSegmentRepository;
  readonly recipientRepository: CampaignRecipientRepository;
  readonly deliveryJobRepository: DeliveryJobRepository;
  readonly institutionRepository: InstitutionRepository;
  readonly config: OutreachDeliveryConfig;
  readonly nextRecipientId?: () => string;
  readonly nextJobId?: () => string;
}>;

let prepareSeq = 0;

function defaultId(prefix: string): string {
  prepareSeq += 1;
  return `${prefix}_${prepareSeq}_${Date.now().toString(36)}`;
}

/**
 * Selects up to warm-up institutions from the campaign segment and enqueues DeliveryJobs.
 * Jobs remain idle until campaign is approved + running.
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

  const existingRecipients = await deps.recipientRepository.listByCampaignId(
    campaignIdAsString(campaign.id),
  );
  if (existingRecipients.length > 0) {
    throw new OutreachValidationError("Campaign already prepared.");
  }

  const segment = await deps.segmentRepository.getById(campaign.segmentId);
  if (!segment) {
    throw new OutreachValidationError("Campaign segment is missing.");
  }

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

  const matched = page.items.filter((inst) => institutionMatchesSegment(inst, segment));
  const selected = matched.slice(0, deps.config.warmupBatchSize);

  let recipientCount = 0;
  let skippedDuplicates = 0;
  const campaignId = campaignIdAsString(campaign.id);

  for (const institution of selected) {
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

  return Object.freeze({ recipientCount, skippedDuplicates });
}

export function assertCampaignReadyForRun(campaign: Campaign): void {
  if (campaign.status !== CampaignStatus.Ready && campaign.status !== CampaignStatus.Paused) {
    throw new OutreachValidationError("Campaign must be ready (approved) or paused to run.");
  }
}
