import type { BillingPlanRepository } from "@eduatlas/application";
import {
  createBillingPlan,
  type BillingPlan,
  type EntitlementMap,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export const BILLING_PLANS_COLLECTION = "billing_plans";

type FirestoreBillingPlanDocument = {
  code: string;
  name: string;
  description?: string;
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  discountPercent: number;
  trialDays: number;
  active: boolean;
  sortOrder: number;
  entitlements: Record<string, boolean | number>;
  updatedAt: string;
};

function fromDocument(id: string, data: FirestoreBillingPlanDocument): BillingPlan {
  return createBillingPlan({
    id,
    code: data.code,
    name: data.name,
    description: data.description,
    monthlyPriceTry: data.monthlyPriceTry,
    yearlyPriceTry: data.yearlyPriceTry,
    discountPercent: data.discountPercent,
    trialDays: data.trialDays,
    active: data.active,
    sortOrder: data.sortOrder,
    entitlements: data.entitlements as EntitlementMap,
    updatedAt: data.updatedAt,
  });
}

function toDocument(plan: BillingPlan): FirestoreBillingPlanDocument {
  const entitlements: Record<string, boolean | number> = {};
  for (const [key, value] of Object.entries(plan.entitlements)) {
    if (typeof value === "boolean" || typeof value === "number") {
      entitlements[key] = value;
    }
  }

  return {
    code: plan.code,
    name: plan.name,
    ...(plan.description ? { description: plan.description } : {}),
    monthlyPriceTry: plan.monthlyPriceTry,
    yearlyPriceTry: plan.yearlyPriceTry,
    discountPercent: plan.discountPercent,
    trialDays: plan.trialDays,
    active: plan.active,
    sortOrder: plan.sortOrder,
    entitlements,
    updatedAt: plan.updatedAt,
  };
}

export class FirestoreBillingPlanRepository implements BillingPlanRepository {
  constructor(
    private readonly db: Firestore,
    private readonly collectionPath: string = BILLING_PLANS_COLLECTION,
  ) {}

  private collection() {
    return this.db.collection(this.collectionPath);
  }

  async listAll(): Promise<readonly BillingPlan[]> {
    countFirestoreRead();
    const snap = await this.collection().get();
    const plans = snap.docs.map((doc) =>
      fromDocument(doc.id, doc.data() as FirestoreBillingPlanDocument),
    );
    return plans.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
  }

  async listActive(): Promise<readonly BillingPlan[]> {
    const all = await this.listAll();
    return all.filter((plan) => plan.active);
  }

  async getByCode(code: string): Promise<BillingPlan | null> {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return null;
    countFirestoreRead();
    const snap = await this.collection().where("code", "==", normalized).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) return null;
    return fromDocument(doc.id, doc.data() as FirestoreBillingPlanDocument);
  }

  async save(plan: BillingPlan): Promise<BillingPlan> {
    countFirestoreWrite();
    await this.collection().doc(plan.id).set(toDocument(plan), { merge: false });
    return plan;
  }
}

export function createFirestoreBillingPlanRepository(db: Firestore): BillingPlanRepository {
  return new FirestoreBillingPlanRepository(db);
}
