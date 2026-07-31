/**
 * Delivery attempt log for outbound transactional email (PRD-MKT-002).
 */
export type MailDeliveryStatus = "sent" | "failed" | "skipped";

export type MailDeliveryLog = Readonly<{
  readonly id: string;
  readonly leadId: string;
  readonly institutionId: string;
  readonly status: MailDeliveryStatus;
  readonly provider: string;
  readonly success: boolean;
  readonly retryCount: number;
  readonly attemptedAt: string;
  readonly notificationKind: string;
  readonly skipReason?: string;
  readonly errorMessage?: string;
}>;

export type CreateMailDeliveryLogInput = {
  id: string;
  leadId: string;
  institutionId: string;
  status: MailDeliveryStatus;
  provider: string;
  retryCount?: number;
  attemptedAt: string;
  notificationKind?: string;
  skipReason?: string;
  errorMessage?: string;
};

export const MAIL_NOTIFICATION_KIND_CLAIM_INVITE = "institution_claim_invite";

export function createMailDeliveryLog(input: CreateMailDeliveryLogInput): MailDeliveryLog {
  const id = input.id.trim();
  const leadId = input.leadId.trim();
  const institutionId = input.institutionId.trim();
  const provider = input.provider.trim();
  const notificationKind = (input.notificationKind ?? MAIL_NOTIFICATION_KIND_CLAIM_INVITE).trim();
  const retryCount = input.retryCount ?? 0;

  if (!id) throw new Error("MailDeliveryLog.id is required.");
  if (!leadId) throw new Error("MailDeliveryLog.leadId is required.");
  if (!institutionId) throw new Error("MailDeliveryLog.institutionId is required.");
  if (!provider) throw new Error("MailDeliveryLog.provider is required.");
  if (!notificationKind) throw new Error("MailDeliveryLog.notificationKind is required.");
  if (retryCount < 0) throw new Error("MailDeliveryLog.retryCount must be >= 0.");
  if (Number.isNaN(Date.parse(input.attemptedAt))) {
    throw new Error("MailDeliveryLog.attemptedAt must be a valid ISO timestamp.");
  }

  const success = input.status === "sent";

  return Object.freeze({
    id,
    leadId,
    institutionId,
    status: input.status,
    provider,
    success,
    retryCount,
    attemptedAt: input.attemptedAt,
    notificationKind,
    ...(input.skipReason?.trim() ? { skipReason: input.skipReason.trim() } : {}),
    ...(input.errorMessage?.trim() ? { errorMessage: input.errorMessage.trim() } : {}),
  });
}
