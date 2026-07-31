import {
  BillingEntitlement,
  createBillingPlan,
  DefaultBillingPlanCode,
  type BillingPlan,
  type EntitlementMap,
  type InstitutionSubscription,
  isSubscriptionEntitled,
} from "@eduatlas/domain";
import type { BillingPlanRepository } from "./billing-plan-repository";
import type { InstitutionSubscriptionRepository } from "./subscription-repository";

export type InstitutionBillingAccess = Readonly<{
  readonly planCode: string;
  readonly planName: string;
  readonly entitlements: EntitlementMap;
  readonly subscription: InstitutionSubscription | null;
  readonly isPaidOrTrialing: boolean;
}>;

/** Fallback when catalog is empty — matches PRD FREE seed. */
export function defaultFreePlan(): BillingPlan {
  return createBillingPlan({
    id: "plan_free",
    code: DefaultBillingPlanCode.Free,
    name: "Free",
    monthlyPriceTry: 0,
    yearlyPriceTry: 0,
    trialDays: 0,
    sortOrder: 0,
    entitlements: {
      [BillingEntitlement.FreeLeadQuota]: 3,
    },
  });
}

export type ResolveInstitutionBillingAccessDependencies = Readonly<{
  readonly billingPlanRepository: BillingPlanRepository;
  readonly subscriptionRepository: InstitutionSubscriptionRepository;
}>;

export async function resolveInstitutionBillingAccess(
  institutionId: string,
  deps: ResolveInstitutionBillingAccessDependencies,
  now = new Date(),
): Promise<InstitutionBillingAccess> {
  const subscription = await deps.subscriptionRepository.getByInstitutionId(institutionId);
  const entitled = isSubscriptionEntitled(subscription, now);

  let plan: BillingPlan | null = null;
  if (entitled && subscription) {
    plan = await deps.billingPlanRepository.getByCode(subscription.planCode);
  }
  if (!plan) {
    plan =
      (await deps.billingPlanRepository.getByCode(DefaultBillingPlanCode.Free)) ??
      defaultFreePlan();
  }

  return {
    planCode: plan.code,
    planName: plan.name,
    entitlements: plan.entitlements,
    subscription,
    isPaidOrTrialing: entitled,
  };
}
