import { NotificationType } from "@eduatlas/domain";
import type { EmitNotificationResult, NotificationService } from "./notification-service";

/**
 * Typed event helpers — infrastructure remaining thin at call sites.
 */

export async function emitLeadReceived(
  service: NotificationService,
  input: {
    userId: string;
    email?: string;
    institutionId: string;
    institutionName?: string;
    leadId: string;
    now?: string;
  },
): Promise<EmitNotificationResult> {
  return service.emit({
    type: NotificationType.LeadReceived,
    userId: input.userId,
    email: input.email,
    institutionId: input.institutionId,
    institutionName: input.institutionName,
    leadId: input.leadId,
    now: input.now,
    metadata: { leadId: input.leadId },
  });
}

export async function emitClaimSubmitted(
  service: NotificationService,
  input: {
    userId: string;
    email: string;
    institutionId: string;
    claimRequestId: string;
    now?: string;
  },
): Promise<EmitNotificationResult> {
  return service.emit({
    type: NotificationType.ClaimSubmitted,
    userId: input.userId,
    email: input.email,
    institutionId: input.institutionId,
    claimRequestId: input.claimRequestId,
    now: input.now,
    metadata: { claimRequestId: input.claimRequestId },
  });
}

export async function emitClaimApproved(
  service: NotificationService,
  input: {
    userId: string;
    email?: string;
    institutionId: string;
    institutionName?: string;
    claimRequestId?: string;
    now?: string;
  },
): Promise<EmitNotificationResult> {
  return service.emit({
    type: NotificationType.ClaimApproved,
    userId: input.userId,
    email: input.email,
    institutionId: input.institutionId,
    institutionName: input.institutionName,
    claimRequestId: input.claimRequestId,
    now: input.now,
  });
}

export async function emitProfileUpdated(
  service: NotificationService,
  input: {
    userId: string;
    email?: string;
    institutionId: string;
    institutionName?: string;
    now?: string;
  },
): Promise<EmitNotificationResult> {
  return service.emit({
    type: NotificationType.ProfileUpdated,
    userId: input.userId,
    email: input.email,
    institutionId: input.institutionId,
    institutionName: input.institutionName,
    now: input.now,
  });
}

export async function emitPasswordReset(
  service: NotificationService,
  input: { userId: string; email: string; now?: string },
): Promise<EmitNotificationResult> {
  return service.emit({
    type: NotificationType.PasswordReset,
    userId: input.userId,
    email: input.email,
    now: input.now,
  });
}

export async function emitWelcome(
  service: NotificationService,
  input: {
    userId: string;
    email: string;
    accountRole?: "parent" | "owner";
    now?: string;
  },
): Promise<EmitNotificationResult> {
  return service.emit({
    type: NotificationType.Welcome,
    userId: input.userId,
    email: input.email,
    accountRole: input.accountRole,
    now: input.now,
  });
}

export async function emitEmailVerification(
  service: NotificationService,
  input: {
    userId: string;
    email?: string;
    accountRole?: "parent" | "owner";
    verificationLink?: string;
    now?: string;
  },
): Promise<EmitNotificationResult> {
  return service.emit({
    type: NotificationType.EmailVerification,
    userId: input.userId,
    email: input.email,
    accountRole: input.accountRole,
    verificationLink: input.verificationLink,
    now: input.now,
  });
}
