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
import type { EmailService } from "../notifications/email-service";
import type { RenderedEmail } from "../notifications/email-templates";
import { applyMailTokens } from "./apply-mail-tokens";
import type { CampaignLogRepository } from "./campaign-log-repository";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { CampaignRepository } from "./campaign-repository";
import type { CampaignSegmentRepository } from "./campaign-segment-repository";
import type { CampaignTemplateRepository } from "./campaign-template-repository";
import {
  renderClaimInvitationMail,
} from "./claim-invitation-mail";
import { OutreachNotFoundError, OutreachValidationError } from "./errors";
import type { OutreachQueue } from "./outreach-queue";
import { CLAIM_INVITATION_TEMPLATE_ID } from "./outreach-seeds";
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
let testJobSeq = 0;

function nextLogId(): string {
  logSeq += 1;
  return `clog_${logSeq}`;
}

function nextRecipientId(): string {
  recipientSeq += 1;
  return `crec_${recipientSeq}`;
}

function nextTestRecipientId(): string {
  testJobSeq += 1;
  return `test_${testJobSeq}`;
}

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
    ...overrides,
  };
}

/**
 * Institution outreach orchestration.
 * Bulk delivery remains queue-only; test send is the only path that calls EmailService.
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

  async updateCampaign(input: {
    campaignId: string;
    name: string;
    description?: string;
    templateId: string;
    segmentId: string;
    subjectOverride: string;
    preheader: string;
    now: string;
  }): Promise<Campaign> {
    const campaign = await this.requireCampaign(input.campaignId);
    if (
      campaign.status !== CampaignStatus.Draft &&
      campaign.status !== CampaignStatus.Ready
    ) {
      throw new OutreachValidationError("Only draft or ready campaigns can be updated.");
    }

    const subjectOverride = input.subjectOverride.trim();
    const preheader = input.preheader.trim();
    if (!subjectOverride) {
      throw new OutreachValidationError("Campaign subject is required.");
    }
    if (!preheader) {
      throw new OutreachValidationError("Campaign preheader is required.");
    }

    const template = await this.deps.templateRepository.getById(input.templateId.trim());
    if (!template) {
      throw new OutreachValidationError("Campaign template is missing.");
    }
    const segment = await this.deps.segmentRepository.getById(input.segmentId.trim());
    if (!segment) {
      throw new OutreachValidationError("Campaign segment is missing.");
    }

    const updated = createCampaign(
      toCreateInput(campaign, {
        name: input.name,
        description: input.description,
        templateId: input.templateId,
        segmentId: input.segmentId,
        subjectOverride,
        preheader,
      }),
    );
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Campaign updated.", input.now);
    return updated;
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

    const updated = createCampaign(
      toCreateInput(campaign, { status: CampaignStatus.Ready }),
    );
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Campaign marked ready.", now);
    return updated;
  }

  async start(campaignId: string, now: string): Promise<Campaign> {
    const campaign = await this.requireCampaign(campaignId);
    if (campaign.status !== CampaignStatus.Ready && campaign.status !== CampaignStatus.Paused) {
      throw new OutreachValidationError("Only ready or paused campaigns can start/resume running.");
    }
    const updated = createCampaign(
      toCreateInput(campaign, {
        status: CampaignStatus.Running,
        startedAt: campaign.startedAt ?? now,
      }),
    );
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
    const updated = createCampaign(
      toCreateInput(campaign, {
        status: CampaignStatus.Cancelled,
        completedAt: now,
      }),
    );
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
   * Renders campaign email for admin preview (no send).
   */
  async previewCampaignMail(input: {
    campaignId: string;
    institutionName: string;
    ctaHref: string;
  }): Promise<RenderedEmail> {
    const campaign = await this.requireCampaign(input.campaignId);
    return this.renderCampaignMail(campaign, {
      institutionName: input.institutionName,
      ctaHref: input.ctaHref,
    });
  }

  /**
   * Sends exactly one test email. Does not start the campaign or enqueue segment recipients.
   */
  async sendTestEmail(input: {
    campaignId: string;
    to: string;
    institutionName: string;
    ctaHref: string;
    now: string;
    emailService: EmailService;
  }): Promise<{ messageId: string; rendered: RenderedEmail }> {
    const to = input.to.trim();
    if (!to || !to.includes("@")) {
      throw new OutreachValidationError("Test email recipient is required.");
    }

    const campaign = await this.requireCampaign(input.campaignId);
    const rendered = await this.renderCampaignMail(campaign, {
      institutionName: input.institutionName,
      ctaHref: input.ctaHref,
    });

    await this.deps.queue.enqueue({
      campaignId: campaignIdAsString(campaign.id),
      recipientId: nextTestRecipientId(),
      channel: campaign.channel,
      createdAt: input.now,
      availableAt: input.now,
    });

    const result = await input.emailService.send({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    await this.log(
      campaignIdAsString(campaign.id),
      `Test email sent to ${to}.`,
      input.now,
      { to, messageId: result.messageId },
    );

    return { messageId: result.messageId, rendered };
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

  private async renderCampaignMail(
    campaign: Campaign,
    tokens: { institutionName: string; ctaHref: string },
  ): Promise<RenderedEmail> {
    const template = await this.deps.templateRepository.getById(campaign.templateId);
    if (!template) {
      throw new OutreachValidationError("Campaign template is missing.");
    }

    const subject = campaign.subjectOverride?.trim() || template.subject;
    const preheader = campaign.preheader?.trim() || template.preview;
    if (!subject.trim()) {
      throw new OutreachValidationError("Campaign subject is required.");
    }
    if (!preheader.trim()) {
      throw new OutreachValidationError("Campaign preheader is required.");
    }

    if (template.id === CLAIM_INVITATION_TEMPLATE_ID) {
      return renderClaimInvitationMail({
        subject,
        preheader,
        institutionName: tokens.institutionName,
        ctaHref: tokens.ctaHref,
        bodyLines: template.bodyLines,
      });
    }

    const personalized = {
      institutionName: tokens.institutionName,
    };
    const rendered = renderCampaignTemplatePreview({
      ...template,
      subject: applyMailTokens(subject, personalized),
      preview: applyMailTokens(preheader, personalized),
      bodyLines: template.bodyLines.map((line) => applyMailTokens(line, personalized)),
    });
    return rendered;
  }

  private async setStatus(
    campaign: Campaign,
    status: typeof CampaignStatus.Paused | typeof CampaignStatus.Running,
    now: string,
    message: string,
  ): Promise<Campaign> {
    const updated = createCampaign(toCreateInput(campaign, { status }));
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
