import type { EntitlementMap } from "./entitlements";

export type BillingPlanCode = string;

export type BillingPlan = Readonly<{
  readonly id: string;
  readonly code: BillingPlanCode;
  readonly name: string;
  readonly description?: string;
  readonly monthlyPriceTry: number;
  readonly yearlyPriceTry: number;
  readonly discountPercent: number;
  readonly trialDays: number;
  readonly active: boolean;
  readonly sortOrder: number;
  readonly entitlements: EntitlementMap;
  readonly updatedAt: string;
}>;

export type CreateBillingPlanInput = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly monthlyPriceTry?: number;
  readonly yearlyPriceTry?: number;
  readonly discountPercent?: number;
  readonly trialDays?: number;
  readonly active?: boolean;
  readonly sortOrder?: number;
  readonly entitlements?: EntitlementMap;
  readonly updatedAt?: string;
};

export function createBillingPlan(input: CreateBillingPlanInput): BillingPlan {
  const code = input.code.trim().toLowerCase();
  const name = input.name.trim();
  if (!input.id.trim()) throw new Error("BillingPlan.id is required.");
  if (!code) throw new Error("BillingPlan.code is required.");
  if (!name) throw new Error("BillingPlan.name is required.");

  return Object.freeze({
    id: input.id.trim(),
    code,
    name,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    monthlyPriceTry: Math.max(0, input.monthlyPriceTry ?? 0),
    yearlyPriceTry: Math.max(0, input.yearlyPriceTry ?? 0),
    discountPercent: Math.min(100, Math.max(0, input.discountPercent ?? 0)),
    trialDays: Math.max(0, Math.floor(input.trialDays ?? 0)),
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
    entitlements: Object.freeze({ ...(input.entitlements ?? {}) }),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  });
}

/** Built-in seed codes — not the only allowed codes. */
export const DefaultBillingPlanCode = {
  Free: "free",
  Pro: "pro",
  Premium: "premium",
} as const;
