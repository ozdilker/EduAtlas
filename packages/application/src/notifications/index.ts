export {
  ConsoleEmailService,
  createConsoleEmailService,
} from "./console-email-service";
export type { EmailService, SendEmailInput, SendEmailResult } from "./email-service";
export { EDUATLAS_MAIL_FROM_DEFAULT } from "./email-service";
export {
  type EmailTemplateModel,
  type RenderedEmail,
  renderEmailTemplate,
  renderNotificationEmail,
} from "./email-templates";
export {
  emitClaimApproved,
  emitClaimSubmitted,
  emitEmailVerification,
  emitLeadReceived,
  emitPasswordReset,
  emitProfileUpdated,
  emitWelcome,
} from "./emit-notification-events";
export {
  createInMemoryNotificationRepository,
  InMemoryNotificationRepository,
} from "./in-memory-notification-repository";
export {
  createInMemoryClaimInviteEmailRateLimitStore,
  createInMemoryMailDeliveryLogRepository,
  InMemoryClaimInviteEmailRateLimitStore,
  InMemoryMailDeliveryLogRepository,
} from "./in-memory-mail-delivery";
export type {
  ClaimInviteEmailRateLimitStore,
  MailDeliveryLogRepository,
} from "./mail-delivery-log-repository";
export {
  buildNotificationCopy,
  type NotificationCopy,
  type NotificationEventPayload,
} from "./notification-copy";
export { resolveEmailCtaHref } from "./resolve-email-cta-href";
export type {
  ListNotificationsOptions,
  NotificationRepository,
} from "./notification-repository";
export {
  createNotificationService,
  type EmitNotificationInput,
  type EmitNotificationResult,
  NotificationService,
  type NotificationServiceDependencies,
} from "./notification-service";
export {
  CLAIM_INVITE_RATE_LIMIT_MS,
  CLAIM_INVITE_TOKEN_TTL_MS,
  hashClaimInviteToken,
  type SendInstitutionClaimInviteEmailDependencies,
  type SendInstitutionClaimInviteEmailInput,
  type SendInstitutionClaimInviteEmailResult,
  sendInstitutionClaimInviteEmail,
} from "./send-institution-claim-invite-email";
