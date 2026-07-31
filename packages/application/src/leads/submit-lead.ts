import {
  createInstitutionId,
  createLead,
  type Institution,
  type Lead,
  LeadRole,
  LeadStatus,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { emitLeadReceived } from "../notifications/emit-notification-events";
import type { NotificationService } from "../notifications/notification-service";
import { isLeadRateLimited, isLeadSpamSubmission } from "./abuse-guards";
import {
  LeadInstitutionNotFoundError,
  LeadRateLimitedError,
  LeadSpamRejectedError,
  LeadValidationError,
} from "./errors";
import type { LeadRepository } from "./lead-repository";

export type LeadNotificationRecipient = {
  userId: string;
  email?: string;
};

export type SubmitLeadInput = {
  institutionId: string;
  parentName: string;
  phone: string;
  message: string;
  role?: string;
  email?: string;
  preferredContactTime?: string;
  consentAccepted: boolean;
  consentPolicyVersion?: string;
  /** Honeypot field — must stay empty (spam protection placeholder). */
  honeypot?: string;
  /** Optional client key for future rate limiting. */
  clientKey?: string;
  leadId?: string;
  now?: string;
};

export type SubmitLeadResult = Readonly<{
  readonly lead: Lead;
}>;

export type SubmitLeadDependencies = {
  leadRepository: LeadRepository;
  institutionRepository: InstitutionRepository;
  /** Optional — when provided, emits Lead Received after successful save. */
  notificationService?: NotificationService;
  resolveLeadRecipient?: (institutionId: string) => Promise<LeadNotificationRecipient | null>;
  /**
   * Optional growth claim-invite email after successful save (fail-open).
   * Must not throw into the lead result path.
   */
  sendClaimInviteEmail?: (input: {
    lead: Lead;
    institution: Institution;
  }) => Promise<void>;
};

/**
 * Application service: validate + store a parent information request.
 * Notifications are optional and never fail the lead write.
 */
export async function submitLead(
  input: SubmitLeadInput,
  deps: SubmitLeadDependencies,
): Promise<SubmitLeadResult> {
  if (isLeadSpamSubmission({ honeypot: input.honeypot })) {
    throw new LeadSpamRejectedError();
  }

  if (
    isLeadRateLimited({
      institutionId: input.institutionId,
      phone: input.phone,
      clientKey: input.clientKey,
    })
  ) {
    throw new LeadRateLimitedError();
  }

  if (!input.consentAccepted) {
    throw new LeadValidationError("Lead consent is required.");
  }

  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    throw new LeadValidationError("Lead.institutionId is required.");
  }

  const institution = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    throw new LeadInstitutionNotFoundError(institutionId);
  }

  const now = input.now ?? new Date().toISOString();
  const leadId = input.leadId?.trim() || `lead_${createLeadIdSuffix()}`;

  let lead: Lead;
  try {
    lead = createLead({
      id: leadId,
      institutionId,
      parentName: input.parentName,
      phone: input.phone,
      message: input.message,
      role: input.role ?? LeadRole.Parent,
      status: LeadStatus.New,
      consentAcceptedAt: now,
      consentPolicyVersion: input.consentPolicyVersion,
      email: input.email,
      preferredContactTime: input.preferredContactTime,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    throw new LeadValidationError(
      error instanceof Error ? error.message : "Lead validation failed.",
    );
  }

  const saved = await deps.leadRepository.save(lead);

  if (deps.notificationService && deps.resolveLeadRecipient) {
    try {
      const recipient = await deps.resolveLeadRecipient(institutionId);
      if (recipient?.userId) {
        await emitLeadReceived(deps.notificationService, {
          userId: recipient.userId,
          email: recipient.email,
          institutionId,
          institutionName: institution.name,
          leadId: saved.id.value,
          now,
        });
      }
    } catch {
      // Fail-open: lead persistence already succeeded.
    }
  }

  if (deps.sendClaimInviteEmail) {
    try {
      await deps.sendClaimInviteEmail({ lead: saved, institution });
    } catch {
      // Fail-open: claim-invite mail must never fail the lead write.
    }
  }

  return Object.freeze({ lead: saved });
}

function createLeadIdSuffix(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
