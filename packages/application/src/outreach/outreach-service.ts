import {
  type Campaign,
  type CampaignLearnings,
  type CampaignLog,
  CampaignLogLevel,
  type CampaignPreSendChecklist,
  type CampaignRecipient,
  CampaignRecipientStatus,
  CampaignStatus,
  type CreateCampaignInput,
  campaignIdAsString,
  createCampaign,
  createCampaignLog,
  createCampaignRecipient,
  createDeliveryJob,
  DeliveryJobStatus,
  emptyPreSendChecklist,
  isPreSendChecklistComplete,
  mergePreSendChecklist,
} from "@eduatlas/domain";
import type { OutreachDeliveryConfig } from "../delivery/delivery-config";
import { loadOutreachDeliveryConfig } from "../delivery/delivery-config";
import type { DeliveryJobRepository } from "../delivery/delivery-job-repository";
import type { InstitutionRepository } from "../institutions/institution-repository";
import type { EmailService } from "../notifications/email-service";
import type { RenderedEmail } from "../notifications/email-templates";
import { applyMailTokens, assertPersonalizationInstitutionName } from "./apply-mail-tokens";
import type { CampaignLogRepository } from "./campaign-log-repository";
import { type CampaignProgress, getCampaignProgress } from "./campaign-progress";
import type { CampaignRecipientRepository } from "./campaign-recipient-repository";
import type { CampaignRepository } from "./campaign-repository";
import type { CampaignSegmentRepository } from "./campaign-segment-repository";
import type { CampaignTemplateRepository } from "./campaign-template-repository";
import { renderClaimInvitationMail } from "./claim-invitation-mail";
import { OutreachNotFoundError, OutreachValidationError } from "./errors";
import type { OutreachQueue } from "./outreach-queue";
import { CLAIM_INVITATION_TEMPLATE_ID } from "./outreach-seeds";
import {
  type PrepareCampaignResult,
  prepareCampaign as prepareCampaignAction,
} from "./prepare-campaign";
import {
  importExternalRecipients as importExternalRecipientsAction,
  prepareCampaignFromImport as prepareCampaignFromImportAction,
  prepareImportedCampaign as prepareImportedCampaignAction,
  type ImportExternalRecipientsResult,
  type OutreachImportParseResult,
} from "./import-campaign-recipients";
import { renderCampaignTemplatePreview } from "./render-campaign-template";
import { resolveCampaignBodyLines } from "./resolve-campaign-body-lines";
import {
  createDefaultWarmupSettings,
  currentWarmupLimit,
  elevateWarmupSettings,
  lowerWarmupSettings,
  type OutreachWarmupSettings,
} from "./warmup-settings";
import type { OutreachWarmupSettingsRepository } from "./warmup-settings-repository";

export type OutreachServiceDependencies = Readonly<{
  readonly campaignRepository: CampaignRepository;
  readonly recipientRepository: CampaignRecipientRepository;
  readonly segmentRepository: CampaignSegmentRepository;
  readonly templateRepository: CampaignTemplateRepository;
  readonly logRepository: CampaignLogRepository;
  readonly queue: OutreachQueue;
  readonly deliveryJobRepository?: DeliveryJobRepository;
  readonly institutionRepository?: InstitutionRepository;
  readonly deliveryConfig?: OutreachDeliveryConfig;
  /** Absolute URL for campaign email header mark. */
  readonly mailLogoUrl?: string;
  readonly warmupSettingsRepository?: OutreachWarmupSettingsRepository;
  /** Optional Phase 1 billing circuit breaker — fail-open when omitted. */
  readonly billingProtectionRepository?:
    | import("../billing-protection").BillingProtectionRepository
    | null;
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
    recipientSource: campaign.recipientSource,
    importMeta: campaign.importMeta,
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
    recipientSource?: "segment" | "external_import";
    now: string;
  }): Promise<Campaign> {
    const campaign = await this.requireCampaign(input.campaignId);
    if (campaign.status !== CampaignStatus.Draft && campaign.status !== CampaignStatus.Ready) {
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

    const recipientSource = input.recipientSource ?? campaign.recipientSource ?? "segment";

    const updated = createCampaign(
      toCreateInput(campaign, {
        name: input.name,
        description: input.description,
        templateId: input.templateId,
        segmentId: input.segmentId,
        subjectOverride,
        preheader,
        recipientSource,
      }),
    );
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Campaign updated.", input.now);
    return updated;
  }

  async markReady(campaignId: string, now: string): Promise<Campaign> {
    return this.approveCampaign(campaignId, now);
  }

  /**
   * Approve prepared campaign for run (draft → ready). Requires recipients.
   */
  async approveCampaign(campaignId: string, now: string): Promise<Campaign> {
    const campaign = await this.requireCampaign(campaignId);
    if (campaign.status !== CampaignStatus.Draft) {
      throw new OutreachValidationError("Only draft campaigns can be approved.");
    }
    const template = await this.deps.templateRepository.getById(campaign.templateId);
    if (!template) {
      throw new OutreachValidationError("Campaign template is missing.");
    }
    const segment = await this.deps.segmentRepository.getById(campaign.segmentId);
    if (!segment) {
      throw new OutreachValidationError("Campaign segment is missing.");
    }
    const recipients = await this.deps.recipientRepository.listByCampaignId(
      campaignIdAsString(campaign.id),
    );
    if (recipients.length === 0) {
      throw new OutreachValidationError("Approve requires a prepared recipient list.");
    }
    if (campaign.recipientSource === "external_import") {
      const prepared = recipients.filter(
        (r) => r.status !== CampaignRecipientStatus.Pending,
      );
      if (prepared.length === 0) {
        throw new OutreachValidationError(
          "Approve requires Import Prepare (Import alone is not enough).",
        );
      }
    }

    const updated = createCampaign(
      toCreateInput(campaign, {
        status: CampaignStatus.Ready,
        execution: {
          ...campaign.execution,
          approvedAt: now,
          preparedAt: campaign.execution?.preparedAt,
        },
      }),
    );
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Campaign approved (ready).", now);
    return updated;
  }

  async prepareCampaign(campaignId: string, now: string): Promise<PrepareCampaignResult> {
    if (!this.deps.deliveryJobRepository || !this.deps.institutionRepository) {
      throw new OutreachValidationError("Delivery repositories are not configured.");
    }
    const config = this.deps.deliveryConfig ?? loadOutreachDeliveryConfig();
    const targetLimit = this.deps.warmupSettingsRepository
      ? currentWarmupLimit(await this.getWarmupSettings())
      : config.warmupBatchSize;
    const result = await prepareCampaignAction(
      { campaignId, now },
      {
        campaignRepository: this.deps.campaignRepository,
        segmentRepository: this.deps.segmentRepository,
        recipientRepository: this.deps.recipientRepository,
        deliveryJobRepository: this.deps.deliveryJobRepository,
        institutionRepository: this.deps.institutionRepository,
        config,
        targetLimit,
        billingProtectionRepository: this.deps.billingProtectionRepository,
      },
    );
    await this.log(
      campaignId.trim(),
      `Prepared ${result.recipientCount} recipient(s) (total ${result.totalRecipients}/${result.targetLimit}); skipped ${result.skippedDuplicates}.`,
      now,
    );
    if (result.recipientCount > 0 || result.totalRecipients > 0) {
      const campaign = await this.requireCampaign(campaignId);
      await this.deps.campaignRepository.update(
        createCampaign(
          toCreateInput(campaign, {
            execution: {
              ...campaign.execution,
              preparedAt: campaign.execution?.preparedAt ?? now,
            },
            preSendChecklist: campaign.preSendChecklist ?? emptyPreSendChecklist(),
          }),
        ),
      );
    }
    return result;
  }

  /**
   * Draft-only incremental prepare up to the current platform warm-up stage limit.
   */
  async expandWarmup(campaignId: string, now: string): Promise<PrepareCampaignResult> {
    return this.prepareCampaign(campaignId, now);
  }

  /**
   * Excel/CSV import — persists Pending CampaignRecipients only (no DeliveryJobs).
   */
  async importExternalRecipients(input: {
    campaignId: string;
    fileName: string;
    content: Uint8Array;
    now: string;
  }): Promise<ImportExternalRecipientsResult> {
    if (!this.deps.institutionRepository) {
      throw new OutreachValidationError("Institution repository is not configured.");
    }
    const result = await importExternalRecipientsAction(input, {
      campaignRepository: this.deps.campaignRepository,
      recipientRepository: this.deps.recipientRepository,
      institutionRepository: this.deps.institutionRepository,
      billingProtectionRepository: this.deps.billingProtectionRepository,
    });
    await this.log(
      input.campaignId.trim(),
      `Imported ${result.recipientCount} recipient(s) (matched ${result.matchedCount}, unmatched ${result.unmatchedCount}); file=${input.fileName}.`,
      input.now,
    );
    return result;
  }

  /**
   * Excel/CSV import prepare — validates file, enqueues recipients/jobs, leaves draft.
   * Prefer importExternalRecipients + prepareImportedCampaign for the wizard.
   */
  async prepareCampaignFromImport(input: {
    campaignId: string;
    fileName: string;
    content: Uint8Array;
    now: string;
  }): Promise<PrepareCampaignResult & { parse: OutreachImportParseResult }> {
    if (!this.deps.deliveryJobRepository || !this.deps.institutionRepository) {
      throw new OutreachValidationError("Delivery repositories are not configured.");
    }
    const config = this.deps.deliveryConfig ?? loadOutreachDeliveryConfig();
    const targetLimit = this.deps.warmupSettingsRepository
      ? currentWarmupLimit(await this.getWarmupSettings())
      : config.warmupBatchSize;
    const result = await prepareCampaignFromImportAction(
      {
        campaignId: input.campaignId,
        fileName: input.fileName,
        content: input.content,
        now: input.now,
      },
      {
        campaignRepository: this.deps.campaignRepository,
        segmentRepository: this.deps.segmentRepository,
        recipientRepository: this.deps.recipientRepository,
        deliveryJobRepository: this.deps.deliveryJobRepository,
        institutionRepository: this.deps.institutionRepository,
        config,
        targetLimit,
        billingProtectionRepository: this.deps.billingProtectionRepository,
      },
    );
    await this.log(
      input.campaignId.trim(),
      `Import prepared ${result.recipientCount} recipient(s) (total ${result.totalRecipients}/${result.targetLimit}); file=${input.fileName}; accepted=${result.parse.accepted.length}; rejected=${result.parse.rejected.length}; dupEmails=${result.parse.duplicateEmailCount}.`,
      input.now,
    );
    return result;
  }

  /**
   * Promotes persisted external-import Pending recipients to Queued + DeliveryJobs.
   */
  async prepareImportedCampaign(
    campaignId: string,
    now: string,
  ): Promise<PrepareCampaignResult> {
    if (!this.deps.deliveryJobRepository || !this.deps.institutionRepository) {
      throw new OutreachValidationError("Delivery repositories are not configured.");
    }
    const config = this.deps.deliveryConfig ?? loadOutreachDeliveryConfig();
    const targetLimit = this.deps.warmupSettingsRepository
      ? currentWarmupLimit(await this.getWarmupSettings())
      : config.warmupBatchSize;
    const result = await prepareImportedCampaignAction(
      { campaignId, now },
      {
        campaignRepository: this.deps.campaignRepository,
        segmentRepository: this.deps.segmentRepository,
        recipientRepository: this.deps.recipientRepository,
        deliveryJobRepository: this.deps.deliveryJobRepository,
        institutionRepository: this.deps.institutionRepository,
        config,
        targetLimit,
        billingProtectionRepository: this.deps.billingProtectionRepository,
      },
    );
    await this.log(
      campaignId.trim(),
      `Import prepare (persisted): ${result.recipientCount} recipient(s) (total ${result.totalRecipients}/${result.targetLimit}).`,
      now,
    );
    return result;
  }

  async getWarmupSettings(): Promise<OutreachWarmupSettings> {
    if (!this.deps.warmupSettingsRepository) {
      return createDefaultWarmupSettings();
    }
    return this.deps.warmupSettingsRepository.get();
  }

  async elevateWarmupStage(input: {
    now: string;
    by?: string;
    note?: string;
  }): Promise<OutreachWarmupSettings> {
    if (!this.deps.warmupSettingsRepository) {
      throw new OutreachValidationError("Warm-up settings repository is not configured.");
    }
    const current = await this.deps.warmupSettingsRepository.get();
    const elevated = elevateWarmupSettings(current, {
      now: input.now,
      by: input.by,
      note: input.note,
    });
    if (!elevated) {
      throw new OutreachValidationError("Warm-up stage is already at maximum (4).");
    }
    const saved = await this.deps.warmupSettingsRepository.save(elevated);
    await this.log(
      "platform",
      `Warm-up stage elevated to ${saved.stage} (limit ${currentWarmupLimit(saved)}).`,
      input.now,
      { stage: String(saved.stage) },
    );
    return saved;
  }

  async lowerWarmupStage(input: {
    now: string;
    by?: string;
    note?: string;
  }): Promise<OutreachWarmupSettings> {
    if (!this.deps.warmupSettingsRepository) {
      throw new OutreachValidationError("Warm-up settings repository is not configured.");
    }
    const current = await this.deps.warmupSettingsRepository.get();
    const lowered = lowerWarmupSettings(current, {
      now: input.now,
      by: input.by,
      note: input.note,
    });
    if (!lowered) {
      throw new OutreachValidationError("Warm-up stage is already at minimum (1).");
    }
    const saved = await this.deps.warmupSettingsRepository.save(lowered);
    await this.log(
      "platform",
      `Warm-up stage lowered to ${saved.stage} (limit ${currentWarmupLimit(saved)}).`,
      input.now,
      { stage: String(saved.stage) },
    );
    return saved;
  }

  async getProgress(campaignId: string): Promise<CampaignProgress> {
    if (!this.deps.deliveryJobRepository) {
      return Object.freeze({
        total: 0,
        sent: 0,
        queued: 0,
        locked: 0,
        failed: 0,
        bounced: 0,
        percent: 0,
      });
    }
    return getCampaignProgress(campaignId, this.deps.deliveryJobRepository);
  }

  async start(campaignId: string, now: string): Promise<Campaign> {
    const campaign = await this.requireCampaign(campaignId);
    if (campaign.status !== CampaignStatus.Ready && campaign.status !== CampaignStatus.Paused) {
      throw new OutreachValidationError("Only ready or paused campaigns can start/resume running.");
    }
    if (
      campaign.status === CampaignStatus.Ready &&
      !isPreSendChecklistComplete(campaign.preSendChecklist)
    ) {
      throw new OutreachValidationError("Pre-send checklist must be completed before Run.");
    }

    const all = await this.deps.campaignRepository.list();
    const otherRunning = all.find(
      (c) =>
        c.status === CampaignStatus.Running &&
        campaignIdAsString(c.id) !== campaignIdAsString(campaign.id),
    );
    if (otherRunning) {
      throw new OutreachValidationError("Another campaign is already running.");
    }

    const updated = createCampaign(
      toCreateInput(campaign, {
        status: CampaignStatus.Running,
        startedAt: campaign.startedAt ?? now,
        execution: {
          ...campaign.execution,
          startedAt: campaign.execution?.startedAt ?? now,
        },
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

  /**
   * Permanently deletes a draft campaign and its recipients, logs, and delivery jobs.
   * Only `CampaignStatus.Draft` is allowed (includes UI “prepared” bucket).
   */
  async deleteDraft(campaignId: string): Promise<void> {
    const campaign = await this.requireCampaign(campaignId);
    if (campaign.status !== CampaignStatus.Draft) {
      throw new OutreachValidationError("Only draft campaigns can be deleted.");
    }
    const id = campaignIdAsString(campaign.id);
    await this.deps.recipientRepository.deleteByCampaignId(id);
    await this.deps.logRepository.deleteByCampaignId(id);
    if (this.deps.deliveryJobRepository) {
      await this.deps.deliveryJobRepository.deleteByCampaignId(id);
    }
    await this.deps.campaignRepository.delete(id);
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
        execution: {
          ...campaign.execution,
          cancelledAt: now,
        },
      }),
    );
    await this.deps.campaignRepository.update(updated);

    if (this.deps.deliveryJobRepository) {
      const jobs = await this.deps.deliveryJobRepository.listByCampaignId(
        campaignIdAsString(campaign.id),
      );
      for (const job of jobs) {
        if (job.status !== DeliveryJobStatus.Pending && job.status !== DeliveryJobStatus.Locked) {
          continue;
        }
        await this.deps.deliveryJobRepository.update(
          createDeliveryJob({
            ...job,
            status: DeliveryJobStatus.Cancelled,
            lockedAt: undefined,
            lockedBy: undefined,
            updatedAt: now,
          }),
        );
      }
    }

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
    if (campaign.status !== CampaignStatus.Running && campaign.status !== CampaignStatus.Ready) {
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

  async previewTemplate(templateId: string, institutionName: string): Promise<RenderedEmail> {
    const template = await this.deps.templateRepository.getById(templateId);
    if (!template) {
      throw new OutreachNotFoundError(`Template not found: ${templateId}`);
    }
    const name = assertPersonalizationInstitutionName(institutionName);
    if (template.id === CLAIM_INVITATION_TEMPLATE_ID) {
      return renderClaimInvitationMail({
        subject: template.subject,
        preheader: template.preview,
        institutionName: name,
        ctaHref: "https://eduatlas.com.tr/login",
        bodyLines: template.bodyLines,
        ...(this.deps.mailLogoUrl ? { logoUrl: this.deps.mailLogoUrl } : {}),
      });
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
    /** When set, overrides persisted campaign subject for live preview. */
    subjectOverride?: string;
    /** When set, overrides persisted campaign preheader for live preview. */
    preheader?: string;
    /** When set, overrides persisted campaign description for live preview. */
    description?: string;
  }): Promise<RenderedEmail> {
    const campaign = await this.requireCampaign(input.campaignId);
    return this.renderMailContent({
      templateId: campaign.templateId,
      subject: input.subjectOverride?.trim() || campaign.subjectOverride || "",
      preheader: input.preheader?.trim() || campaign.preheader || "",
      description:
        input.description !== undefined
          ? input.description
          : (campaign.description ?? ""),
      institutionName: input.institutionName,
      ctaHref: input.ctaHref,
    });
  }

  /**
   * Renders mail from draft fields (no campaign persistence required).
   * Used by Growth Center live preview while editing subject/preheader/body.
   */
  async previewMailDraft(input: {
    templateId: string;
    subject: string;
    preheader: string;
    description?: string;
    institutionName: string;
    ctaHref: string;
  }): Promise<RenderedEmail> {
    return this.renderMailContent({
      templateId: input.templateId,
      subject: input.subject,
      preheader: input.preheader,
      description: input.description ?? "",
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

    await this.log(campaignIdAsString(campaign.id), `Test email sent to ${to}.`, input.now, {
      to,
      messageId: result.messageId,
    });

    await this.deps.campaignRepository.update(
      createCampaign(
        toCreateInput(campaign, {
          execution: {
            ...campaign.execution,
            lastTestMailAt: input.now,
          },
          preSendChecklist: mergePreSendChecklist(campaign.preSendChecklist, {
            testMailSent: true,
          }),
        }),
      ),
    );

    return { messageId: result.messageId, rendered };
  }

  async updatePreSendChecklist(input: {
    campaignId: string;
    patch: Partial<CampaignPreSendChecklist>;
    now: string;
  }): Promise<Campaign> {
    const campaign = await this.requireCampaign(input.campaignId);
    const preSendChecklist = mergePreSendChecklist(campaign.preSendChecklist, input.patch);
    const updated = createCampaign(toCreateInput(campaign, { preSendChecklist }));
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Pre-send checklist updated.", input.now);
    return updated;
  }

  async updateLearnings(input: {
    campaignId: string;
    notes: string;
    now: string;
    updatedBy?: string;
  }): Promise<Campaign> {
    const campaign = await this.requireCampaign(input.campaignId);
    if (
      campaign.status !== CampaignStatus.Completed &&
      campaign.status !== CampaignStatus.Cancelled &&
      campaign.status !== CampaignStatus.Failed
    ) {
      throw new OutreachValidationError(
        "Learnings can only be saved on completed/cancelled/failed campaigns.",
      );
    }
    const learnings: CampaignLearnings = {
      notes: input.notes,
      updatedAt: input.now,
      ...(input.updatedBy ? { updatedBy: input.updatedBy } : {}),
    };
    const updated = createCampaign(toCreateInput(campaign, { learnings }));
    await this.deps.campaignRepository.update(updated);
    await this.log(campaignIdAsString(updated.id), "Campaign learnings saved.", input.now);
    return updated;
  }

  async listCampaignLearnings(): Promise<
    readonly Readonly<{
      campaignId: string;
      name: string;
      notes: string;
      updatedAt?: string;
    }>[]
  > {
    const campaigns = await this.deps.campaignRepository.list();
    return Object.freeze(
      campaigns
        .filter((c) => Boolean(c.learnings?.notes?.trim()))
        .map((c) =>
          Object.freeze({
            campaignId: campaignIdAsString(c.id),
            name: c.name,
            notes: c.learnings!.notes,
            ...(c.learnings?.updatedAt ? { updatedAt: c.learnings.updatedAt } : {}),
          }),
        ),
    );
  }

  /**
   * Marks all non-claimed recipients for an institution as claimed (conversion hook).
   * Not wired into claim approval in this PRD.
   */
  async markRecipientClaimed(input: { institutionId: string; claimedAt: string }): Promise<number> {
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

  async countRecipientsByStatus(campaignId: string): Promise<Readonly<Record<string, number>>> {
    const rows = await this.deps.recipientRepository.listByCampaignId(campaignId);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return Object.freeze(counts);
  }

  async listCampaignLogs(campaignId: string): Promise<readonly CampaignLog[]> {
    const rows = await this.deps.logRepository.listByCampaignId(campaignId.trim());
    return Object.freeze([...rows].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)));
  }

  private async renderCampaignMail(
    campaign: Campaign,
    tokens: { institutionName: string; ctaHref: string },
  ): Promise<RenderedEmail> {
    return this.renderMailContent({
      templateId: campaign.templateId,
      subject: campaign.subjectOverride ?? "",
      preheader: campaign.preheader ?? "",
      description: campaign.description ?? "",
      institutionName: tokens.institutionName,
      ctaHref: tokens.ctaHref,
    });
  }

  private async renderMailContent(input: {
    templateId: string;
    subject: string;
    preheader: string;
    description?: string;
    institutionName: string;
    ctaHref: string;
  }): Promise<RenderedEmail> {
    const institutionName = assertPersonalizationInstitutionName(input.institutionName);
    const template = await this.deps.templateRepository.getById(input.templateId.trim());
    if (!template) {
      throw new OutreachValidationError("Campaign template is missing.");
    }

    const subject = input.subject.trim() || template.subject;
    const preheader = input.preheader.trim() || template.preview;
    if (!subject.trim()) {
      throw new OutreachValidationError("Campaign subject is required.");
    }
    if (!preheader.trim()) {
      throw new OutreachValidationError("Campaign preheader is required.");
    }

    const bodyLines = resolveCampaignBodyLines({
      description: input.description,
      templateBodyLines: template.bodyLines,
    });

    if (template.id === CLAIM_INVITATION_TEMPLATE_ID) {
      return renderClaimInvitationMail({
        subject,
        preheader,
        institutionName,
        ctaHref: input.ctaHref,
        bodyLines,
        ...(this.deps.mailLogoUrl ? { logoUrl: this.deps.mailLogoUrl } : {}),
      });
    }

    const personalized = { institutionName };
    return renderCampaignTemplatePreview({
      ...template,
      subject: applyMailTokens(subject, personalized),
      preview: applyMailTokens(preheader, personalized),
      bodyLines: bodyLines.map((line) => applyMailTokens(line, personalized)),
    });
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
