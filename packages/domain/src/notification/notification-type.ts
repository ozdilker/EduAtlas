/**
 * Canonical notification event types (Release-Alpha foundation).
 * No marketing types — transactional / account only.
 */
export enum NotificationType {
  LeadReceived = "lead_received",
  ClaimSubmitted = "claim_submitted",
  ClaimApproved = "claim_approved",
  ProfileUpdated = "profile_updated",
  PasswordReset = "password_reset",
  Welcome = "welcome",
  EmailVerification = "email_verification",
}

export const NOTIFICATION_TYPES: readonly NotificationType[] = Object.freeze([
  NotificationType.LeadReceived,
  NotificationType.ClaimSubmitted,
  NotificationType.ClaimApproved,
  NotificationType.ProfileUpdated,
  NotificationType.PasswordReset,
  NotificationType.Welcome,
  NotificationType.EmailVerification,
]);

const TYPE_SET = new Set<string>(NOTIFICATION_TYPES);

export function isNotificationType(value: string): value is NotificationType {
  return TYPE_SET.has(value);
}

export function parseNotificationType(value: string): NotificationType {
  if (!isNotificationType(value)) {
    throw new Error(`Unknown NotificationType: ${value}`);
  }
  return value;
}
