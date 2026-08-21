import {
  type Campaign,
  CampaignStatus,
  campaignIdAsString,
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
import { enqueuePreparedTargets } from "./enqueue-prepared-targets";
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
  if (campaign.recipientSource === "external_import") {
    throw new OutreachValidationError(
      "Bu kampanya Excel/CSV alıcı kaynağı kullanıyor. Segment Prepare yerine Import Prepare kullanın.",
    );
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
  const candidates = matched.filter(
    (inst) => !existingInstitutionIds.has(institutionIdAsString(inst.id)),
  );

  const targets = candidates.flatMap((institution) => {
    const email = institution.contact.email?.trim();
    if (!email) return [];
    return [
      Object.freeze({
        institutionId: institutionIdAsString(institution.id),
        email,
        displayName: institution.name,
      }),
    ];
  });

  const skippedNoEmail = candidates.length - targets.length;

  const result = await enqueuePreparedTargets(
    {
      campaign,
      now: input.now,
      targets,
      targetLimit,
      existingRecipientInstitutionIds: existingInstitutionIds,
      existingRecipientCount: existingRecipients.length,
    },
    deps,
  );

  return Object.freeze({
    ...result,
    skippedDuplicates: result.skippedDuplicates + skippedNoEmail,
  });
}

export function assertCampaignReadyForRun(campaign: Campaign): void {
  if (campaign.status !== CampaignStatus.Ready && campaign.status !== CampaignStatus.Paused) {
    throw new OutreachValidationError("Campaign must be ready (approved) or paused to run.");
  }
}
