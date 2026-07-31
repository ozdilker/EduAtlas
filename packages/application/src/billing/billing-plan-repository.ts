import type { BillingPlan } from "@eduatlas/domain";

export interface BillingPlanRepository {
  listActive(): Promise<readonly BillingPlan[]>;
  listAll(): Promise<readonly BillingPlan[]>;
  getByCode(code: string): Promise<BillingPlan | null>;
  save(plan: BillingPlan): Promise<BillingPlan>;
}
