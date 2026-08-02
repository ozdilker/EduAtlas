import {
  campaignIdAsString,
  CampaignLogLevel,
  CampaignRecipientStatus,
  CampaignStatus,
  createCampaign,
  createCampaignLog,
  createCampaignRecipient,
  type Campaign,
  type CampaignRecipient,
  type CreateCampaignInput,
} from "@eduatlas/domain";
import type { RenderedEmail } from "../notifications/email-templates";
import type { CampaignLogRepository } from "./campaign-log-repository";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { CampaignRepository } from "./campaign-repository";
import type { CampaignSegmentRepository } from "./campaign-segment-repository";
import type { CampaignTemplateRepository } from "./campaign-template-repository";
import { OutreachNotFoundError, OutreachValidationError } from "./errors";
import type { OutreachQueue } from "./outreach-queue";
import { renderCampaignTemplatePreview } from "./render-campaign-template";

export type OutreachServiceDependencies = Readonly<{
  readonly campaignRepository: CampaignRepository;
  readonly recipientRepository: CampaignRecipientRepository;
  readonly segmentRepository: CampaignSegmentRepository;
  readonly templateRepository: CampaignTemplateRepository;
  readonly logRepository: CampaignLogRepository;
  readonly queue: OutreachQueue;
}>;

let logSeq = 0;
let recipientSeq = 0;

function nextLogId(): string {
  logSeq += 1;
  return `clog_${logSeq}`;
}

function nextRecipientId(): string {
  recipientSeq += 1;
  return `crec_${recipientSeq}`;
}

/**
 * Institution outreach orchestration — queue only, never sends mail.
 */
export class OutreachService {
  constructor(private readonly deps: OutreachServiceDependencies) {}

  async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const campaign = createCampaign({
      ...input,
      status: input.status ?? CampaignStatus.Draft,
    });
    await this.deps.campaignRepository.save(campaign);
    await this.log(campaignIdAsString(campaign.id), "Campaign created.", input.createdAt);
    return campaign;
  }

  async markReady(campaignId: string, now: string): Promise<Campaign> {
    const campaign = await this.requireCampaign(campaignId);
    if (campaign.status !== CampaignStatus.Draft) {
      throw new OutreachValidationError("Only draft campaigns can be marked ready.");
    }
    const template = await this.deps.templateRepository.getById(campaign.templateId);
    if (!template) {
      throw new OutreachValidationError("Campaign template is missing.");
    }
    const segment = await this.deps.segmentRepository.getById(campaign.segmentId);
    if (!segment) {
      throw new OutreachValidationError("Campaign segment is missing.");
    }

    const updated = createCampaign({
      id: campaignIdAsString(campaign.id),
      name: campaign.name,
      description: campaign.description,
      status: CampaignStatus.Ready,
      channel: campaign.channel,
      templateId: campaign.templateId,
      segmentId: campaign.segmentId,
      createdAt: campaign.createdAt,
      createdBy: campaign.createdBy,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
    });
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Campaign marked ready.", now);
    return updated;
  }

  async start(campaignId: string, now: string): Promise<Campaign> {
    const campaign = await this.requireCampaign(campaignId);
    if (campaign.status !== CampaignStatus.Ready && campaign.status !== CampaignStatus.Paused) {
      throw new OutreachValidationError("Only ready or paused campaigns can start/resume running.");
    }
    const updated = createCampaign({
      id: campaignIdAsString(campaign.id),
      name: campaign.name,
      description: campaign.description,
      status: CampaignStatus.Running,
      channel: campaign.channel,
      templateId: campaign.templateId,
      segmentId: campaign.segmentId,
      createdAt: campaign.createdAt,
      createdBy: campaign.createdBy,
      startedAt: campaign.startedAt ?? now,
      completedAt: campaign.completedAt,
    });
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Campaign running.", now);
    return updated;
  }

  async pause(campaignId: string, now: string): Promise<Campaign> {
    const campaign = await this.requireCampaign(campaignId);
    if (campaign.status !== CampaignStatus.Running) {
      throw new OutreachValidationError("Only running campaigns can be paused.");
    }
    return this.setStatus(campaign, CampaignStatus.Paused, now, "Campaign paused.");
  }

  async resume(campaignId: string, now: string): Promise<Campaign> {
    return this.start(campaignId, now);
  }

  async cancel(campaignId: string, now: string): Promise<Campaign> {
    const campaign = await this.requireCampaign(campaignId);
    if (
      campaign.status === CampaignStatus.Completed ||
      campaign.status === CampaignStatus.Cancelled
    ) {
      throw new OutreachValidationError("Campaign is already terminal.");
    }
    const updated = createCampaign({
      id: campaignIdAsString(campaign.id),
      name: campaign.name,
      description: campaign.description,
      status: CampaignStatus.Cancelled,
      channel: campaign.channel,
      templateId: campaign.templateId,
      segmentId: campaign.segmentId,
      createdAt: campaign.createdAt,
      createdBy: campaign.createdBy,
      startedAt: campaign.startedAt,
      completedAt: now,
    });
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Campaign cancelled.", now);
    return updated;
  }

  async addRecipients(input: {
    campaignId: string;
    recipients: readonly { institutionId: string; email: string }[];
    now: string;
  }): Promise<readonly CampaignRecipient[]> {
    const campaign = await this.requireCampaign(input.campaignId);
    const saved: CampaignRecipient[] = [];
    for (const row of input.recipients) {
      const recipient = createCampaignRecipient({
        id: nextRecipientId(),
        campaignId: campaignIdAsString(campaign.id),
        institutionId: row.institutionId,
        email: row.email,
        status: CampaignRecipientStatus.Pending,
        createdAt: input.now,
        updatedAt: input.now,
      });
      saved.push(await this.deps.recipientRepository.save(recipient));
    }
    await this.log(
      campaignIdAsString(campaign.id),
      `Added ${saved.length} recipient(s).`,
      input.now,
    );
    return Object.freeze(saved);
  }

  /**
   * Moves pending recipients to queued and enqueues jobs. Does not send email.
   */
  async enqueuePendingRecipients(campaignId: string, now: string): Promise<number> {
    const campaign = await this.requireCampaign(campaignId);
    if (
      campaign.status !== CampaignStatus.Running &&
      campaign.status !== CampaignStatus.Ready
    ) {
      throw new OutreachValidationError("Enqueue requires a ready or running campaign.");
    }

    const recipients = await this.deps.recipientRepository.listByCampaignId(campaignId);
    let count = 0;
    for (const recipient of recipients) {
      if (recipient.status !== CampaignRecipientStatus.Pending) {
        continue;
      }
      await this.deps.queue.enqueue({
        campaignId: campaignIdAsString(campaign.id),
        recipientId: recipient.id,
        channel: campaign.channel,
        createdAt: now,
        availableAt: now,
      });
      await this.deps.recipientRepository.update(
        createCampaignRecipient({
          ...recipient,
          status: CampaignRecipientStatus.Queued,
          updatedAt: now,
        }),
      );
      count += 1;
    }

    await this.log(campaignIdAsString(campaign.id), `Enqueued ${count} recipient(s).`, now, {
      count: String(count),
    });
    return count;
  }

  async previewTemplate(templateId: string): Promise<RenderedEmail> {
    const template = await this.deps.templateRepository.getById(templateId);
    if (!template) {
      throw new OutreachNotFoundError(`Template not found: ${templateId}`);
    }
    return renderCampaignTemplatePreview(template);
  }

  /**
   * Marks all non-claimed recipients for an institution as claimed (conversion hook).
   * Not wired into claim approval in this PRD.
   */
  async markRecipientClaimed(input: {
    institutionId: string;
    claimedAt: string;
  }): Promise<number> {
    const rows = await this.deps.recipientRepository.listByInstitutionId(input.institutionId);
    let updated = 0;
    for (const recipient of rows) {
      if (recipient.status === CampaignRecipientStatus.Claimed || recipient.claimedAt) {
        continue;
      }
      await this.deps.recipientRepository.update(
        createCampaignRecipient({
          ...recipient,
          status: CampaignRecipientStatus.Claimed,
          claimedAt: input.claimedAt,
          updatedAt: input.claimedAt,
        }),
      );
      updated += 1;
    }
    return updated;
  }

  async countRecipientsByStatus(
    campaignId: string,
  ): Promise<Readonly<Record<string, number>>> {
    const rows = await this.deps.recipientRepository.listByCampaignId(campaignId);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return Object.freeze(counts);
  }

  private async setStatus(
    campaign: Campaign,
    status: typeof CampaignStatus.Paused | typeof CampaignStatus.Running,
    now: string,
    message: string,
  ): Promise<Campaign> {
    const updated = createCampaign({
      id: campaignIdAsString(campaign.id),
      name: campaign.name,
      description: campaign.description,
      status,
      channel: campaign.channel,
      templateId: campaign.templateId,
      segmentId: campaign.segmentId,
      createdAt: campaign.createdAt,
      createdBy: campaign.createdBy,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
    });
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), message, now);
    return updated;
  }

  private async requireCampaign(campaignId: string): Promise<Campaign> {
    const campaign = await this.deps.campaignRepository.getById(campaignId.trim());
    if (!campaign) {
      throw new OutreachNotFoundError(`Campaign not found: ${campaignId}`);
    }
    return campaign;
  }

  private async log(
    campaignId: string,
    message: string,
    at: string,
    meta?: Readonly<Record<string, string>>,
  ): Promise<void> {
    await this.deps.logRepository.save(
      createCampaignLog({
        id: nextLogId(),
        campaignId,
        level: CampaignLogLevel.Info,
        message,
        at,
        meta,
      }),
    );
  }
}

export function createOutreachService(deps: OutreachServiceDependencies): OutreachService {
  return new OutreachService(deps);
}
