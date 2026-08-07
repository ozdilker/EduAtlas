import {
  campaignIdAsString,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignRecipient,
  createDeliveryJob,
  DeliveryJobStatus,
  type Campaign,
  type CampaignRecipient,
  type CreateCampaignInput,
  type DeliveryJob,
} from "@eduatlas/domain";
import { buildCampaignPostSummary } from "../outreach/campaign-kit-helpers";
import type { CampaignRecipientRepository } from "../outreach/campaign-recipient-repository";
import type { CampaignRepository } from "../outreach/campaign-repository";
import type { OutreachDeliveryConfig } from "./delivery-config";
import type { DeliveryChannelHandler } from "./delivery-channel-handler";
import type { DeliveryJobRepository } from "./delivery-job-repository";
import type { DeliverySendBudget } from "./delivery-send-budget";

export interface DeliveryWorker {
  tick(now: string): Promise<{ processed: number }>;
}

export type DeliveryWorkerDependencies = Readonly<{
  readonly config: OutreachDeliveryConfig;
  readonly jobRepository: DeliveryJobRepository;
  readonly campaignRepository: CampaignRepository;
  readonly recipientRepository: CampaignRecipientRepository;
  readonly handlers: readonly DeliveryChannelHandler[];
  readonly budget: DeliverySendBudget;
  readonly log?: (message: string, meta?: Record<string, string>) => Promise<void>;
}>;

function toCreateInput(
  campaign: Campaign,
  overrides: Partial<CreateCampaignInput> = {},
): CreateCampaignInput {
  return {
    id: campaignIdAsString(campaign.id),
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    channel: campaign.channel,
    templateId: campaign.templateId,
    segmentId: campaign.segmentId,
    subjectOverride: campaign.subjectOverride,
    preheader: campaign.preheader,
    createdAt: campaign.createdAt,
    createdBy: campaign.createdBy,
    startedAt: campaign.startedAt,
    completedAt: campaign.completedAt,
    preSendChecklist: campaign.preSendChecklist,
    execution: campaign.execution,
    postSummary: campaign.postSummary,
    learnings: campaign.learnings,
    ...overrides,
  };
}

/**
 * Single-instance delivery worker — claim → send → status update.
 */
export class ProcessLocalDeliveryWorker implements DeliveryWorker {
  constructor(private readonly deps: DeliveryWorkerDependencies) {}

  async tick(now: string): Promise<{ processed: number }> {
    const campaigns = await this.deps.campaignRepository.list();
    const running = campaigns.find((c) => c.status === CampaignStatus.Running);
    if (!running) {
      return { processed: 0 };
    }

    const campaignId = campaignIdAsString(running.id);
    let processed = 0;

    while (true) {
      const sentMinute = await this.deps.budget.getSentInCurrentMinute(now);
      const sentToday = await this.deps.budget.getSentToday(now);
      if (sentMinute >= this.deps.config.ratePerMinute) break;
      if (sentToday >= this.deps.config.dailySendLimit) break;

      const job = await this.deps.jobRepository.claimNext({
        now,
        lockedBy: this.deps.config.workerInstanceId,
        lockTtlMs: this.deps.config.lockTtlMs,
        campaignId,
      });
      if (!job) break;

      await this.processJob(running, job, now);
      processed += 1;
    }

    await this.maybeComplete(campaignId, now);
    return { processed };
  }

  private async processJob(
    campaign: Campaign,
    job: DeliveryJob,
    now: string,
  ): Promise<void> {
    const recipient = await this.deps.recipientRepository.getById(job.recipientId);
    if (!recipient) {
      await this.deps.jobRepository.update(
        createDeliveryJob({
          ...job,
          status: DeliveryJobStatus.Failed,
          lastError: "Recipient missing.",
          updatedAt: now,
        }),
      );
      return;
    }

    await this.deps.recipientRepository.update(
      createCampaignRecipient({
        ...recipient,
        status: CampaignRecipientStatus.Sending,
        updatedAt: now,
      }),
    );

    const handler = this.deps.handlers.find((h) => h.channel === job.channel);
    if (!handler) {
      await this.failTransient(job, recipient, now, `No handler for channel ${job.channel}`);
      return;
    }

    const result = await handler.send({ job, recipient, campaign, now });
    if (result.outcome === "accepted") {
      await this.deps.jobRepository.update(
        createDeliveryJob({
          ...job,
          status: DeliveryJobStatus.Sent,
          smtpMessageId: result.smtpMessageId,
          smtpResponse: result.smtpResponse,
          smtpCode: result.smtpCode,
          lockedAt: undefined,
          lockedBy: undefined,
          updatedAt: now,
        }),
      );
      await this.deps.recipientRepository.update(
        createCampaignRecipient({
          ...recipient,
          status: CampaignRecipientStatus.Sent,
          sentAt: now,
          updatedAt: now,
        }),
      );
      await this.deps.budget.recordAcceptedSend(now);
      await this.deps.log?.("Delivery accepted.", {
        jobId: job.id,
        campaignId: job.campaignId,
      });
      return;
    }

    if (result.outcome === "hard_bounce") {
      await this.deps.jobRepository.update(
        createDeliveryJob({
          ...job,
          status: DeliveryJobStatus.Bounced,
          lastError: result.errorMessage,
          smtpMessageId: result.smtpMessageId,
          smtpResponse: result.smtpResponse,
          smtpCode: result.smtpCode,
          lockedAt: undefined,
          lockedBy: undefined,
          updatedAt: now,
        }),
      );
      await this.deps.recipientRepository.update(
        createCampaignRecipient({
          ...recipient,
          status: CampaignRecipientStatus.Bounced,
          lastError: result.errorMessage,
          updatedAt: now,
        }),
      );
      return;
    }

    await this.failTransient(job, recipient, now, result.errorMessage ?? "Transient SMTP failure", {
      smtpMessageId: result.smtpMessageId,
      smtpResponse: result.smtpResponse,
      smtpCode: result.smtpCode,
    });
  }

  private async failTransient(
    job: DeliveryJob,
    recipient: CampaignRecipient,
    now: string,
    errorMessage: string,
    smtp?: { smtpMessageId?: string; smtpResponse?: string; smtpCode?: string },
  ): Promise<void> {
    const nextAttempt = job.attemptCount + 1;
    if (nextAttempt >= job.maxAttempts) {
      await this.deps.jobRepository.update(
        createDeliveryJob({
          ...job,
          status: DeliveryJobStatus.Failed,
          attemptCount: nextAttempt,
          lastError: errorMessage,
          smtpMessageId: smtp?.smtpMessageId,
          smtpResponse: smtp?.smtpResponse,
          smtpCode: smtp?.smtpCode,
          lockedAt: undefined,
          lockedBy: undefined,
          updatedAt: now,
        }),
      );
      await this.deps.recipientRepository.update(
        createCampaignRecipient({
          ...recipient,
          status: CampaignRecipientStatus.Failed,
          lastError: errorMessage,
          updatedAt: now,
        }),
      );
      return;
    }

    const availableAt = new Date(Date.parse(now) + this.deps.config.retryDelayMs).toISOString();
    await this.deps.jobRepository.update(
      createDeliveryJob({
        ...job,
        status: DeliveryJobStatus.Pending,
        attemptCount: nextAttempt,
        availableAt,
        lastError: errorMessage,
        smtpMessageId: smtp?.smtpMessageId,
        smtpResponse: smtp?.smtpResponse,
        smtpCode: smtp?.smtpCode,
        lockedAt: undefined,
        lockedBy: undefined,
        updatedAt: now,
      }),
    );
    await this.deps.recipientRepository.update(
      createCampaignRecipient({
        ...recipient,
        status: CampaignRecipientStatus.Queued,
        lastError: errorMessage,
        updatedAt: now,
      }),
    );
  }

  private async maybeComplete(campaignId: string, now: string): Promise<void> {
    const jobs = await this.deps.jobRepository.listByCampaignId(campaignId);
    if (jobs.length === 0) return;
    const actionable = jobs.some(
      (j) =>
        j.status === DeliveryJobStatus.Pending ||
        j.status === DeliveryJobStatus.Locked,
    );
    if (actionable) return;

    const campaign = await this.deps.campaignRepository.getById(campaignId);
    if (!campaign || campaign.status !== CampaignStatus.Running) return;

    const recipients = await this.deps.recipientRepository.listByCampaignId(campaignId);
    const postSummary = buildCampaignPostSummary({
      campaign,
      jobs,
      recipients,
      completedAt: now,
    });

    await this.deps.campaignRepository.update(
      createCampaign(
        toCreateInput(campaign, {
          status: CampaignStatus.Completed,
          completedAt: now,
          postSummary,
          execution: {
            ...campaign.execution,
            completedAt: now,
            startedAt: campaign.execution?.startedAt ?? campaign.startedAt,
          },
        }),
      ),
    );
  }
}

export function createDeliveryWorker(deps: DeliveryWorkerDependencies): DeliveryWorker {
  return new ProcessLocalDeliveryWorker(deps);
}
