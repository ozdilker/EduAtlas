import type { InstitutionSubscriptionRepository } from "@eduatlas/application";
import {
  createInstitutionSubscription,
  type BillingPeriod,
  type InstitutionSubscription,
  type SubscriptionStatus,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export const INSTITUTION_SUBSCRIPTIONS_COLLECTION = "institution_subscriptions";

type FirestoreSubscriptionDocument = {
  institutionId: string;
  planCode: string;
  status: string;
  billingPeriod?: string;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  paymentProvider: string;
  externalSubscriptionId?: string;
  updatedAt: string;
};

function fromDocument(id: string, data: FirestoreSubscriptionDocument): InstitutionSubscription {
  return createInstitutionSubscription({
    id,
    institutionId: data.institutionId,
    planCode: data.planCode,
    status: data.status as SubscriptionStatus,
    billingPeriod: data.billingPeriod as BillingPeriod | undefined,
    trialEndsAt: data.trialEndsAt,
    currentPeriodStart: data.currentPeriodStart,
    currentPeriodEnd: data.currentPeriodEnd,
    canceledAt: data.canceledAt,
    paymentProvider: data.paymentProvider,
    externalSubscriptionId: data.externalSubscriptionId,
    updatedAt: data.updatedAt,
  });
}

function toDocument(sub: InstitutionSubscription): FirestoreSubscriptionDocument {
  return {
    institutionId: sub.institutionId,
    planCode: sub.planCode,
    status: sub.status,
    ...(sub.billingPeriod ? { billingPeriod: sub.billingPeriod } : {}),
    ...(sub.trialEndsAt ? { trialEndsAt: sub.trialEndsAt } : {}),
    ...(sub.currentPeriodStart ? { currentPeriodStart: sub.currentPeriodStart } : {}),
    ...(sub.currentPeriodEnd ? { currentPeriodEnd: sub.currentPeriodEnd } : {}),
    ...(sub.canceledAt ? { canceledAt: sub.canceledAt } : {}),
    paymentProvider: sub.paymentProvider,
    ...(sub.externalSubscriptionId
      ? { externalSubscriptionId: sub.externalSubscriptionId }
      : {}),
    updatedAt: sub.updatedAt,
  };
}

export class FirestoreInstitutionSubscriptionRepository
  implements InstitutionSubscriptionRepository
{
  constructor(
    private readonly db: Firestore,
    private readonly collectionPath: string = INSTITUTION_SUBSCRIPTIONS_COLLECTION,
  ) {}

  private collection() {
    return this.db.collection(this.collectionPath);
  }

  async getByInstitutionId(institutionId: string): Promise<InstitutionSubscription | null> {
    const id = institutionId.trim();
    if (!id) return null;
    countFirestoreRead();
    // Prefer doc id = institutionId for O(1); fall back to query.
    const direct = await this.collection().doc(id).get();
    if (direct.exists) {
      return fromDocument(direct.id, direct.data() as FirestoreSubscriptionDocument);
    }
    countFirestoreRead();
    const snap = await this.collection().where("institutionId", "==", id).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return fromDocument(doc.id, doc.data() as FirestoreSubscriptionDocument);
  }

  async save(subscription: InstitutionSubscription): Promise<InstitutionSubscription> {
    countFirestoreWrite();
    const docId = subscription.id || subscription.institutionId;
    await this.collection().doc(docId).set(toDocument(subscription), { merge: false });
    return subscription;
  }
}

export function createFirestoreInstitutionSubscriptionRepository(
  db: Firestore,
): InstitutionSubscriptionRepository {
  return new FirestoreInstitutionSubscriptionRepository(db);
}
