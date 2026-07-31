import type { MailDeliveryLog } from "@eduatlas/domain";

/**
 * Persistence port for outbound mail delivery attempts.
 */
export interface MailDeliveryLogRepository {
  save(log: MailDeliveryLog): Promise<MailDeliveryLog>;
}

/**
 * Institution-scoped rate limit for claim-invite emails.
 */
export interface ClaimInviteEmailRateLimitStore {
  getLastSentAt(institutionId: string): Promise<string | null>;
  setLastSentAt(institutionId: string, sentAt: string): Promise<void>;
}
