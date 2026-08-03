import type {
  BillingPlanRepository,
  InstitutionSubscriptionRepository,
  PaymentOrderRepository,
} from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  BillingPeriod,
  createBillingPlan,
  createInstitutionSubscription,
  createPaymentOrder,
  DefaultBillingPlanCode,
  type BillingPlan,
  type InstitutionSubscription,
  type PaymentOrder,
} from "@eduatlas/domain";
import {
  buildDefaultBillingPlans,
  createFirestoreBillingPlanRepository,
  createFirestoreInstitutionSubscriptionRepository,
  createFirestorePaymentOrderRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

let planRepoPromise: Promise<BillingPlanRepository> | undefined;
let subscriptionRepoPromise: Promise<InstitutionSubscriptionRepository> | undefined;
let paymentOrderRepoPromise: Promise<PaymentOrderRepository> | undefined;

function canUseFirebaseBackend(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;
  if (shouldUseFirebaseEmulators(env)) return true;
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

class InMemoryBillingPlanRepository implements BillingPlanRepository {
  private plans = new Map<string, BillingPlan>();

  constructor(seed: readonly BillingPlan[] = buildDefaultBillingPlans()) {
    for (const plan of seed) {
      this.plans.set(plan.code, plan);
    }
  }

  async listAll() {
    return [...this.plans.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async listActive() {
    return (await this.listAll()).filter((p) => p.active);
  }

  async getByCode(code: string) {
    return this.plans.get(code.trim().toLowerCase()) ?? null;
  }

  async save(plan: BillingPlan) {
    this.plans.set(plan.code, plan);
    return plan;
  }
}

class InMemorySubscriptionRepository implements InstitutionSubscriptionRepository {
  private byInstitution = new Map<string, InstitutionSubscription>();

  async getByInstitutionId(institutionId: string) {
    return this.byInstitution.get(institutionId.trim()) ?? null;
  }

  async save(subscription: InstitutionSubscription) {
    this.byInstitution.set(subscription.institutionId, subscription);
    return subscription;
  }
}

class InMemoryPaymentOrderRepository implements PaymentOrderRepository {
  private byOid = new Map<string, PaymentOrder>();

  async getByMerchantOid(merchantOid: string) {
    return this.byOid.get(merchantOid.trim()) ?? null;
  }

  async save(order: PaymentOrder) {
    this.byOid.set(order.merchantOid, order);
    return order;
  }
}

export function getBillingPlanRepository(): Promise<BillingPlanRepository> {
  if (!planRepoPromise) {
    planRepoPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreBillingPlanRepository(getAdminFirestore())
        : new InMemoryBillingPlanRepository(),
    );
  }
  return planRepoPromise;
}

export function getInstitutionSubscriptionRepository(): Promise<InstitutionSubscriptionRepository> {
  if (!subscriptionRepoPromise) {
    subscriptionRepoPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreInstitutionSubscriptionRepository(getAdminFirestore())
        : new InMemorySubscriptionRepository(),
    );
  }
  return subscriptionRepoPromise;
}

export function getPaymentOrderRepository(): Promise<PaymentOrderRepository> {
  if (!paymentOrderRepoPromise) {
    paymentOrderRepoPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestorePaymentOrderRepository(getAdminFirestore())
        : new InMemoryPaymentOrderRepository(),
    );
  }
  return paymentOrderRepoPromise;
}

export function resetBillingRepositoriesForTests(): void {
  planRepoPromise = undefined;
  subscriptionRepoPromise = undefined;
  paymentOrderRepoPromise = undefined;
}

/** Ensure seed plans exist (idempotent upsert). */
export async function ensureDefaultBillingPlansSeeded(): Promise<void> {
  const repo = await getBillingPlanRepository();
  const existing = await repo.getByCode(DefaultBillingPlanCode.Free);
  if (existing) return;
  for (const plan of buildDefaultBillingPlans()) {
    await repo.save(plan);
  }
}

export function emptySubscriptionForTests(
  institutionId: string,
  planCode = DefaultBillingPlanCode.Free,
): InstitutionSubscription {
  return createInstitutionSubscription({
    id: institutionId,
    institutionId,
    planCode,
  });
}

export function emptyPlanForTests(): BillingPlan {
  return createBillingPlan({
    id: "plan_free",
    code: DefaultBillingPlanCode.Free,
    name: "Free",
    entitlements: { freeLeadQuota: 3 },
  });
}

export function emptyPaymentOrderForTests(merchantOid: string, institutionId: string): PaymentOrder {
  return createPaymentOrder({
    merchantOid,
    institutionId,
    planCode: "pro",
    billingPeriod: BillingPeriod.Monthly,
    amountTry: 499,
  });
}
