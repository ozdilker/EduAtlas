import type {
  ClaimInviteEmailRateLimitStore,
  MailDeliveryLogRepository,
} from "@eduatlas/application";
import { createMailDeliveryLog, type MailDeliveryLog } from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { INSTITUTIONS_COLLECTION } from "../institutions/firestore-institution-document";

export const MAIL_DELIVERY_LOGS_COLLECTION = "mail_delivery_logs";

export class FirestoreMailDeliveryLogRepository implements MailDeliveryLogRepository {
  constructor(
    private readonly db: Firestore,
    private readonly collectionPath: string = MAIL_DELIVERY_LOGS_COLLECTION,
  ) {}

  async save(log: MailDeliveryLog): Promise<MailDeliveryLog> {
    await this.db.collection(this.collectionPath).doc(log.id).set(
      {
        leadId: log.leadId,
        institutionId: log.institutionId,
        status: log.status,
        provider: log.provider,
        success: log.success,
        retryCount: log.retryCount,
        attemptedAt: log.attemptedAt,
        notificationKind: log.notificationKind,
        ...(log.skipReason ? { skipReason: log.skipReason } : {}),
        ...(log.errorMessage ? { errorMessage: log.errorMessage } : {}),
      },
      { merge: false },
    );
    return log;
  }
}

export class FirestoreClaimInviteEmailRateLimitStore implements ClaimInviteEmailRateLimitStore {
  constructor(private readonly db: Firestore) {}

  async getLastSentAt(institutionId: string): Promise<string | null> {
    const snap = await this.db.collection(INSTITUTIONS_COLLECTION).doc(institutionId.trim()).get();
    if (!snap.exists) return null;
    const value = snap.data()?.lastClaimInviteEmailAt;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  async setLastSentAt(institutionId: string, sentAt: string): Promise<void> {
    await this.db
      .collection(INSTITUTIONS_COLLECTION)
      .doc(institutionId.trim())
      .set({ lastClaimInviteEmailAt: sentAt }, { merge: true });
  }
}

export function createFirestoreMailDeliveryLogRepository(
  firestore: Firestore,
): FirestoreMailDeliveryLogRepository {
  return new FirestoreMailDeliveryLogRepository(firestore);
}

export function createFirestoreClaimInviteEmailRateLimitStore(
  firestore: Firestore,
): FirestoreClaimInviteEmailRateLimitStore {
  return new FirestoreClaimInviteEmailRateLimitStore(firestore);
}

/** Re-export create helper for typed logs in adapters (unused locally kept for symmetry). */
export { createMailDeliveryLog };
