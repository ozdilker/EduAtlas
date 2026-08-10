/**
 * Runtime billing cost-protection state (Firestore site_settings/billing_protection).
 * Used as a soft circuit breaker — not for disabling Cloud Billing.
 */

export const BILLING_PROTECTION_STATES = ["NORMAL", "WARNING", "PROTECTION", "EMERGENCY"] as const;

export type BillingProtectionState = (typeof BILLING_PROTECTION_STATES)[number];

export const BILLING_PROTECTION_SOURCES = ["manual", "budget_pubsub", "admin_override"] as const;

export type BillingProtectionSource = (typeof BILLING_PROTECTION_SOURCES)[number];

export type BillingProtection = Readonly<{
  readonly state: BillingProtectionState;
  readonly updatedAt: string;
  readonly source: BillingProtectionSource;
  readonly budgetRatio?: number;
  readonly rawThreshold?: number;
  readonly messageId?: string;
  readonly previousState?: BillingProtectionState;
  readonly overrideState?: BillingProtectionState;
  readonly overrideUntil?: string;
  readonly overrideBy?: string;
  readonly reason?: string;
  /** Cloud Billing costIntervalStart for the active budget period. */
  readonly billingPeriodStart?: string;
  /** Last observed costAmount from a budget Pub/Sub notification. */
  readonly lastCostAmount?: number;
  /** Best-effort observation time (Pub/Sub publishTime) for out-of-order guards. */
  readonly lastObservedAt?: string;
  readonly currencyCode?: string;
  /** Highest forecast threshold exceeded when present (observability). */
  readonly forecastRatio?: number;
}>;

export type CreateBillingProtectionInput = {
  readonly state?: BillingProtectionState;
  readonly updatedAt?: string;
  readonly source?: BillingProtectionSource;
  readonly budgetRatio?: number;
  readonly rawThreshold?: number;
  readonly messageId?: string;
  readonly previousState?: BillingProtectionState;
  readonly overrideState?: BillingProtectionState;
  readonly overrideUntil?: string;
  readonly overrideBy?: string;
  readonly reason?: string;
  readonly billingPeriodStart?: string;
  readonly lastCostAmount?: number;
  readonly lastObservedAt?: string;
  readonly currencyCode?: string;
  readonly forecastRatio?: number;
};

export function isBillingProtectionState(value: unknown): value is BillingProtectionState {
  return (
    typeof value === "string" && (BILLING_PROTECTION_STATES as readonly string[]).includes(value)
  );
}

export function isBillingProtectionSource(value: unknown): value is BillingProtectionSource {
  return (
    typeof value === "string" && (BILLING_PROTECTION_SOURCES as readonly string[]).includes(value)
  );
}

/**
 * Default when the Firestore document is missing: fully operational.
 */
export function createDefaultBillingProtection(
  now: string = new Date().toISOString(),
): BillingProtection {
  return createBillingProtection({
    state: "NORMAL",
    updatedAt: now,
    source: "manual",
    reason: "default_missing_document",
  });
}

export function createBillingProtection(
  input: CreateBillingProtectionInput = {},
): BillingProtection {
  const state = input.state ?? "NORMAL";
  if (!isBillingProtectionState(state)) {
    throw new Error(`BillingProtection.state is invalid: ${String(state)}`);
  }
  const source = input.source ?? "manual";
  if (!isBillingProtectionSource(source)) {
    throw new Error(`BillingProtection.source is invalid: ${String(source)}`);
  }
  if (input.previousState !== undefined && !isBillingProtectionState(input.previousState)) {
    throw new Error(`BillingProtection.previousState is invalid: ${String(input.previousState)}`);
  }
  if (input.overrideState !== undefined && !isBillingProtectionState(input.overrideState)) {
    throw new Error(`BillingProtection.overrideState is invalid: ${String(input.overrideState)}`);
  }

  return Object.freeze({
    state,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    source,
    ...(typeof input.budgetRatio === "number" && Number.isFinite(input.budgetRatio)
      ? { budgetRatio: input.budgetRatio }
      : {}),
    ...(typeof input.rawThreshold === "number" && Number.isFinite(input.rawThreshold)
      ? { rawThreshold: input.rawThreshold }
      : {}),
    ...(input.messageId?.trim() ? { messageId: input.messageId.trim() } : {}),
    ...(input.previousState ? { previousState: input.previousState } : {}),
    ...(input.overrideState ? { overrideState: input.overrideState } : {}),
    ...(input.overrideUntil?.trim() ? { overrideUntil: input.overrideUntil.trim() } : {}),
    ...(input.overrideBy?.trim() ? { overrideBy: input.overrideBy.trim() } : {}),
    ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
    ...(input.billingPeriodStart?.trim()
      ? { billingPeriodStart: input.billingPeriodStart.trim() }
      : {}),
    ...(typeof input.lastCostAmount === "number" && Number.isFinite(input.lastCostAmount)
      ? { lastCostAmount: input.lastCostAmount }
      : {}),
    ...(input.lastObservedAt?.trim() ? { lastObservedAt: input.lastObservedAt.trim() } : {}),
    ...(input.currencyCode?.trim() ? { currencyCode: input.currencyCode.trim() } : {}),
    ...(typeof input.forecastRatio === "number" && Number.isFinite(input.forecastRatio)
      ? { forecastRatio: input.forecastRatio }
      : {}),
  });
}

/**
 * Active override wins while overrideUntil is in the future.
 */
export function resolveEffectiveBillingProtectionState(
  protection: BillingProtection,
  nowMs: number = Date.now(),
): BillingProtectionState {
  if (protection.overrideState && protection.overrideUntil) {
    const until = Date.parse(protection.overrideUntil);
    if (Number.isFinite(until) && until > nowMs) {
      return protection.overrideState;
    }
  }
  return protection.state;
}
