import type { BillingProtectionRepository } from "@eduatlas/application";
import { type BillingProtection, createBillingProtection } from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { TtlCache } from "../cache";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";
import { SITE_SETTINGS_COLLECTION } from "./firestore-homepage-visuals-repository";

export const BILLING_PROTECTION_DOC_ID = "billing_protection";

/** Short TTL — circuit breaker must react faster than generic site settings (5m). */
export const BILLING_PROTECTION_CACHE_TTL_MS = 30_000;

type FirestoreBillingProtectionDocument = {
  state: string;
  updatedAt: string;
  source: string;
  budgetRatio?: number;
  rawThreshold?: number;
  messageId?: string;
  previousState?: string;
  overrideState?: string;
  overrideUntil?: string;
  overrideBy?: string;
  reason?: string;
  billingPeriodStart?: string;
  lastCostAmount?: number;
  lastObservedAt?: string;
  currencyCode?: string;
  forecastRatio?: number;
};

function fromDocument(
  data: FirestoreBillingProtectionDocument | undefined,
): BillingProtection | null {
  if (!data) return null;
  return createBillingProtection({
    state: data.state as BillingProtection["state"],
    updatedAt: data.updatedAt,
    source: data.source as BillingProtection["source"],
    budgetRatio: data.budgetRatio,
    rawThreshold: data.rawThreshold,
    messageId: data.messageId,
    previousState: data.previousState as BillingProtection["previousState"],
    overrideState: data.overrideState as BillingProtection["overrideState"],
    overrideUntil: data.overrideUntil,
    overrideBy: data.overrideBy,
    reason: data.reason,
    billingPeriodStart: data.billingPeriodStart,
    lastCostAmount: data.lastCostAmount,
    lastObservedAt: data.lastObservedAt,
    currencyCode: data.currencyCode,
    forecastRatio: data.forecastRatio,
  });
}

function toDocument(protection: BillingProtection): FirestoreBillingProtectionDocument {
  return {
    state: protection.state,
    updatedAt: protection.updatedAt,
    source: protection.source,
    ...(typeof protection.budgetRatio === "number" ? { budgetRatio: protection.budgetRatio } : {}),
    ...(typeof protection.rawThreshold === "number"
      ? { rawThreshold: protection.rawThreshold }
      : {}),
    ...(protection.messageId ? { messageId: protection.messageId } : {}),
    ...(protection.previousState ? { previousState: protection.previousState } : {}),
    ...(protection.overrideState ? { overrideState: protection.overrideState } : {}),
    ...(protection.overrideUntil ? { overrideUntil: protection.overrideUntil } : {}),
    ...(protection.overrideBy ? { overrideBy: protection.overrideBy } : {}),
    ...(protection.reason ? { reason: protection.reason } : {}),
    ...(protection.billingPeriodStart ? { billingPeriodStart: protection.billingPeriodStart } : {}),
    ...(typeof protection.lastCostAmount === "number"
      ? { lastCostAmount: protection.lastCostAmount }
      : {}),
    ...(protection.lastObservedAt ? { lastObservedAt: protection.lastObservedAt } : {}),
    ...(protection.currencyCode ? { currencyCode: protection.currencyCode } : {}),
    ...(typeof protection.forecastRatio === "number"
      ? { forecastRatio: protection.forecastRatio }
      : {}),
  };
}

export class FirestoreBillingProtectionRepository implements BillingProtectionRepository {
  private readonly cache = new TtlCache<BillingProtection | null>(BILLING_PROTECTION_CACHE_TTL_MS);

  constructor(private readonly db: Firestore) {}

  private docRef() {
    return this.db.collection(SITE_SETTINGS_COLLECTION).doc(BILLING_PROTECTION_DOC_ID);
  }

  async get(): Promise<BillingProtection | null> {
    return this.cache.getOrLoad(BILLING_PROTECTION_DOC_ID, async () => {
      countFirestoreRead();
      const snap = await this.docRef().get();
      if (!snap.exists) return null;
      return fromDocument(snap.data() as FirestoreBillingProtectionDocument);
    });
  }

  async save(protection: BillingProtection): Promise<BillingProtection> {
    countFirestoreWrite();
    await this.docRef().set(toDocument(protection), { merge: false });
    this.cache.clear();
    return protection;
  }
}

export function createFirestoreBillingProtectionRepository(
  db: Firestore,
): BillingProtectionRepository {
  return new FirestoreBillingProtectionRepository(db);
}

export class InMemoryBillingProtectionRepository implements BillingProtectionRepository {
  private current: BillingProtection | null;

  constructor(seed: BillingProtection | null = null) {
    this.current = seed;
  }

  async get() {
    return this.current;
  }

  async save(protection: BillingProtection) {
    this.current = protection;
    return protection;
  }
}

export function createInMemoryBillingProtectionRepository(
  seed: BillingProtection | null = null,
): BillingProtectionRepository {
  return new InMemoryBillingProtectionRepository(seed);
}
