import {
  CampaignChannel,
  type Campaign,
  type CampaignRecipient,
  type DeliveryJob,
} from "@eduatlas/domain";
import type { CampaignTemplateRepository } from "../outreach/campaign-template-repository";
import { renderClaimInvitationMail } from "../outreach/claim-invitation-mail";
import { CLAIM_INVITATION_TEMPLATE_ID } from "../outreach/outreach-seeds";
import { applyMailTokens } from "../outreach/apply-mail-tokens";
import { renderCampaignTemplatePreview } from "../outreach/render-campaign-template";
import { resolveCampaignBodyLines } from "../outreach/resolve-campaign-body-lines";
import type { EmailService } from "../notifications/email-service";
import { classifySmtpError } from "./classify-smtp-error";
import type {
  DeliveryChannelHandler,
  DeliverySendResult,
} from "./delivery-channel-handler";

export type EmailDeliveryHandlerOptions = Readonly<{
  readonly emailService: EmailService;
  readonly templateRepository: CampaignTemplateRepository;
  readonly ctaHref: string;
  readonly resolveInstitutionName: (institutionId: string) => Promise<string>;
  readonly mailLogoUrl?: string;
}>;

/**
 * Email channel handler — EMDS render + EmailService (Hostinger SMTP in prod).
 */
export class EmailDeliveryHandler implements DeliveryChannelHandler {
  readonly channel = CampaignChannel.Email;

  constructor(private readonly options: EmailDeliveryHandlerOptions) {}

  async send(input: {
    job: DeliveryJob;
    recipient: CampaignRecipient;
    campaign: Campaign;
    now: string;
  }): Promise<DeliverySendResult> {
    try {
      const template = await this.options.templateRepository.getById(
        input.campaign.templateId,
      );
      if (!template) {
        return Object.freeze({
          outcome: "transient_failure" as const,
          errorMessage: "Campaign template missing.",
        });
      }

      const institutionName =
        input.recipient.displayName?.trim() ||
        (await this.options.resolveInstitutionName(input.job.institutionId));
      const subject = input.campaign.subjectOverride?.trim() || template.subject;
      const preheader = input.campaign.preheader?.trim() || template.preview;
      const bodyLines = resolveCampaignBodyLines({
        description: input.campaign.description,
        templateBodyLines: template.bodyLines,
      });

      const rendered =
        template.id === CLAIM_INVITATION_TEMPLATE_ID
          ? renderClaimInvitationMail({
              subject,
              preheader,
              institutionName,
              ctaHref: this.options.ctaHref,
              bodyLines,
              ...(this.options.mailLogoUrl
                ? { logoUrl: this.options.mailLogoUrl }
                : {}),
            })
          : renderCampaignTemplatePreview({
              ...template,
              subject: applyMailTokens(subject, { institutionName }),
              preview: applyMailTokens(preheader, { institutionName }),
              bodyLines: bodyLines.map((line) =>
                applyMailTokens(line, { institutionName }),
              ),
            });

      const result = await this.options.emailService.send({
        to: input.recipient.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        messageId: input.job.id,
      });

      if (!result.accepted) {
        return Object.freeze({
          outcome: "transient_failure" as const,
          smtpMessageId: result.messageId,
          smtpResponse: result.smtpResponse,
          smtpCode: result.smtpCode,
          errorMessage: "SMTP did not accept message.",
        });
      }

      return Object.freeze({
        outcome: "accepted" as const,
        smtpMessageId: result.messageId,
        smtpResponse: result.smtpResponse,
        smtpCode: result.smtpCode,
      });
    } catch (error) {
      const klass = classifySmtpError(error);
      const message = error instanceof Error ? error.message : String(error);
      if (klass === "hard_bounce") {
        return Object.freeze({
          outcome: "hard_bounce" as const,
          errorMessage: message,
          smtpResponse: message,
        });
      }
      return Object.freeze({
        outcome: "transient_failure" as const,
        errorMessage: message,
        smtpResponse: message,
      });
    }
  }
}

export function createEmailDeliveryHandler(
  options: EmailDeliveryHandlerOptions,
): EmailDeliveryHandler {
  return new EmailDeliveryHandler(options);
}
