import type { MailDeliveryLog } from "@eduatlas/domain";
import type {
  ClaimInviteEmailRateLimitStore,
  MailDeliveryLogRepository,
} from "../notifications/mail-delivery-log-repository";

export class InMemoryMailDeliveryLogRepository implements MailDeliveryLogRepository {
  readonly logs: MailDeliveryLog[] = [];

  async save(log: MailDeliveryLog): Promise<MailDeliveryLog> {
    this.logs.push(log);
    return log;
  }
}

export class InMemoryClaimInviteEmailRateLimitStore implements ClaimInviteEmailRateLimitStore {
  private readonly lastSent = new Map<string, string>();

  async getLastSentAt(institutionId: string): Promise<string | null> {
    return this.lastSent.get(institutionId.trim()) ?? null;
  }

  async setLastSentAt(institutionId: string, sentAt: string): Promise<void> {
    this.lastSent.set(institutionId.trim(), sentAt);
  }
}

export function createInMemoryMailDeliveryLogRepository(): InMemoryMailDeliveryLogRepository {
  return new InMemoryMailDeliveryLogRepository();
}

export function createInMemoryClaimInviteEmailRateLimitStore(): InMemoryClaimInviteEmailRateLimitStore {
  return new InMemoryClaimInviteEmailRateLimitStore();
}
