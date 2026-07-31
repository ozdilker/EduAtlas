import type { BillingPlanCode } from "./plan";

export const SubscriptionStatus = {
  None: "none",
  Trialing: "trialing",
  Active: "active",
  Canceled: "canceled",
  Expired: "expired",
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const BillingPeriod = {
  Monthly: "monthly",
  Yearly: "yearly",
} as const;

export type BillingPeriod = (typeof BillingPeriod)[keyof typeof BillingPeriod];

export type InstitutionSubscription = Readonly<{
  readonly id: string;
  readonly institutionId: string;
  readonly planCode: BillingPlanCode;
  readonly status: SubscriptionStatus;
  readonly billingPeriod?: BillingPeriod;
  readonly trialEndsAt?: string;
  readonly currentPeriodStart?: string;
  readonly currentPeriodEnd?: string;
  readonly canceledAt?: string;
  readonly paymentProvider: string;
  readonly externalSubscriptionId?: string;
  readonly updatedAt: string;
}>;

export type CreateInstitutionSubscriptionInput = {
  readonly id: string;
  readonly institutionId: string;
  readonly planCode: string;
  readonly status?: SubscriptionStatus;
  readonly billingPeriod?: BillingPeriod;
  readonly trialEndsAt?: string;
  readonly currentPeriodStart?: string;
  readonly currentPeriodEnd?: string;
  readonly canceledAt?: string;
  readonly paymentProvider?: string;
  readonly externalSubscriptionId?: string;
  readonly updatedAt?: string;
};

export function createInstitutionSubscription(
  input: CreateInstitutionSubscriptionInput,
): InstitutionSubscription {
  const institutionId = input.institutionId.trim();
  const planCode = input.planCode.trim().toLowerCase();
  if (!input.id.trim()) throw new Error("InstitutionSubscription.id is required.");
  if (!institutionId) throw new Error("InstitutionSubscription.institutionId is required.");
  if (!planCode) throw new Error("InstitutionSubscription.planCode is required.");

  return Object.freeze({
    id: input.id.trim(),
    institutionId,
    planCode,
    status: input.status ?? SubscriptionStatus.None,
    ...(input.billingPeriod ? { billingPeriod: input.billingPeriod } : {}),
    ...(input.trialEndsAt?.trim() ? { trialEndsAt: input.trialEndsAt.trim() } : {}),
    ...(input.currentPeriodStart?.trim()
      ? { currentPeriodStart: input.currentPeriodStart.trim() }
      : {}),
    ...(input.currentPeriodEnd?.trim() ? { currentPeriodEnd: input.currentPeriodEnd.trim() } : {}),
    ...(input.canceledAt?.trim() ? { canceledAt: input.canceledAt.trim() } : {}),
    paymentProvider: (input.paymentProvider ?? "none").trim() || "none",
    ...(input.externalSubscriptionId?.trim()
      ? { externalSubscriptionId: input.externalSubscriptionId.trim() }
      : {}),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  });
}

export function isSubscriptionEntitled(
  subscription: InstitutionSubscription | null | undefined,
  now = new Date(),
): boolean {
  if (!subscription) return false;
  if (subscription.status === SubscriptionStatus.Active) return true;
  if (subscription.status === SubscriptionStatus.Trialing) {
    if (!subscription.trialEndsAt) return true;
    return new Date(subscription.trialEndsAt).getTime() > now.getTime();
  }
  return false;
}
