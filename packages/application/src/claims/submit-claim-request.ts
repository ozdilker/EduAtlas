import {
  ClaimApplicantRole,
  type ClaimRequest,
  ClaimRequestStatus,
  createClaimRequest,
  createInstitutionId,
} from "@eduatlas/domain";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { emitClaimSubmitted } from "../notifications/emit-notification-events";
import type { NotificationService } from "../notifications/notification-service";
import { isClaimRateLimited, isClaimSpamSubmission } from "./abuse-guards";
import type { ClaimInviteTokenRepository } from "./claim-invite-token-repository";
import type { ClaimRequestRepository } from "./claim-request-repository";
import {
  ClaimInstitutionNotFoundError,
  ClaimRateLimitedError,
  ClaimSpamRejectedError,
  ClaimValidationError,
} from "./errors";

export type SubmitClaimRequestInput = {
  institutionId: string;
  applicantName: string;
  role?: string;
  phone: string;
  email: string;
  message: string;
  evidenceUrl?: string;
  /** Honeypot field — must stay empty (spam protection placeholder). */
  honeypot?: string;
  /** Optional client key for future rate limiting. */
  clientKey?: string;
  claimRequestId?: string;
  /** Authenticated applicant uid when available (binding prep). */
  userId?: string;
  /** When set, marks the claim invite token used after successful save. */
  claimInviteTokenId?: string;
  now?: string;
};

export type SubmitClaimRequestResult = Readonly<{
  readonly claimRequest: ClaimRequest;
}>;

export type SubmitClaimRequestDependencies = {
  claimRequestRepository: ClaimRequestRepository;
  institutionRepository: InstitutionRepository;
  notificationService?: NotificationService;
  claimInviteTokenRepository?: ClaimInviteTokenRepository;
};

/**
 * Application service: validate + store an institution ownership claim request.
 * Notifications are optional and never fail the claim write.
 */
export async function submitClaimRequest(
  input: SubmitClaimRequestInput,
  deps: SubmitClaimRequestDependencies,
): Promise<SubmitClaimRequestResult> {
  if (isClaimSpamSubmission({ honeypot: input.honeypot })) {
    throw new ClaimSpamRejectedError();
  }

  if (
    isClaimRateLimited({
      institutionId: input.institutionId,
      email: input.email,
      phone: input.phone,
      clientKey: input.clientKey,
    })
  ) {
    throw new ClaimRateLimitedError();
  }

  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    throw new ClaimValidationError("ClaimRequest.institutionId is required.");
  }

  const institution = await deps.institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    throw new ClaimInstitutionNotFoundError(institutionId);
  }

  const now = input.now ?? new Date().toISOString();
  const claimRequestId = input.claimRequestId?.trim() || `claim_${createClaimIdSuffix()}`;

  let claimRequest: ClaimRequest;
  try {
    claimRequest = createClaimRequest({
      id: claimRequestId,
      institutionId,
      applicantName: input.applicantName,
      role: input.role ?? ClaimApplicantRole.Owner,
      phone: input.phone,
      email: input.email,
      message: input.message,
      status: ClaimRequestStatus.Pending,
      evidenceUrl: input.evidenceUrl,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    throw new ClaimValidationError(
      error instanceof Error ? error.message : "ClaimRequest validation failed.",
    );
  }

  const saved = await deps.claimRequestRepository.save(claimRequest);

  const inviteTokenId = input.claimInviteTokenId?.trim();
  if (inviteTokenId && deps.claimInviteTokenRepository) {
    try {
      await deps.claimInviteTokenRepository.markUsed(inviteTokenId, now);
    } catch {
      // Fail-open: claim already saved; token may remain redeemable once more.
    }
  }

  if (deps.notificationService) {
    try {
      const recipientUserId =
        saved.userId?.trim() || `email_${saved.email.replace(/[^a-z0-9]/g, "_")}`;
      await emitClaimSubmitted(deps.notificationService, {
        userId: recipientUserId,
        email: saved.email,
        institutionId,
        claimRequestId: saved.id.value,
        now,
      });
    } catch {
      // Fail-open: claim persistence already succeeded.
    }
  }

  return Object.freeze({ claimRequest: saved });
}

function createClaimIdSuffix(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
