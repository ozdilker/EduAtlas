/**
 * Pure budget → BillingProtection state mapping (Phase 2).
 *
 * Kept in the functions package so Firebase deploy stays self-contained
 * (functions/ is outside the npm workspaces graph).
 */

export type BillingProtectionState = "NORMAL" | "WARNING" | "PROTECTION" | "EMERGENCY";

export type BudgetNotificationPayload = Readonly<{
  readonly budgetDisplayName?: string;
  readonly costAmount: number;
  readonly budgetAmount: number;
  readonly currencyCode?: string;
  readonly costIntervalStart?: string;
  readonly budgetAmountType?: string;
  readonly alertThresholdExceeded?: number;
  readonly forecastThresholdExceeded?: number;
}>;

export type ParsedBudgetNotification = Readonly<{
  readonly budgetDisplayName: string | null;
  readonly costAmount: number;
  readonly budgetAmount: number;
  readonly ratio: number;
  readonly currencyCode: string | null;
  readonly billingPeriodStart: string | null;
  readonly alertThresholdExceeded: number | null;
  readonly forecastThresholdExceeded: number | null;
}>;

export type BudgetObservation = Readonly<{
  readonly state: BillingProtectionState;
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
  readonly updatedAt?: string;
  readonly source?: string;
}>;

export type ResolveBillingProtectionStateInput = Readonly<{
  readonly ratio: number;
  readonly previousState: BillingProtectionState;
  /** When true, ignore hysteresis and map solely from ratio (new billing month). */
  readonly newBillingPeriod?: boolean;
  readonly forecastThresholdExceeded?: number | null;
}>;

const STATE_RANK: Record<BillingProtectionState, number> = {
  NORMAL: 0,
  WARNING: 1,
  PROTECTION: 2,
  EMERGENCY: 3,
};

/** Map spend ratio to the nominal protection band (before hysteresis). */
export function mapRatioToBillingProtectionState(ratio: number): BillingProtectionState {
  if (!Number.isFinite(ratio) || ratio < 0) {
    return "NORMAL";
  }
  if (ratio < 0.5) return "NORMAL";
  if (ratio < 0.75) return "WARNING";
  if (ratio < 1) return "PROTECTION";
  return "EMERGENCY";
}

/**
 * Resolve next protection state from actual spend ratio + hysteresis.
 *
 * Forecast never creates EMERGENCY. Actual spend always wins for severity.
 * Escalation is immediate; downgrade requires recovery margins.
 */
export function resolveBillingProtectionState(
  input: ResolveBillingProtectionStateInput,
): BillingProtectionState {
  const ratio = input.ratio;
  const previous = input.previousState;
  let raw = mapRatioToBillingProtectionState(ratio);

  // Forecast ≥ 100% may elevate to PROTECTION, but never to EMERGENCY while actual < 100%.
  const forecast = input.forecastThresholdExceeded;
  if (typeof forecast === "number" && Number.isFinite(forecast) && forecast >= 1 && ratio < 1) {
    if (STATE_RANK[raw] < STATE_RANK.PROTECTION) {
      raw = "PROTECTION";
    } else if (raw === "EMERGENCY") {
      raw = "PROTECTION";
    }
  }

  if (input.newBillingPeriod) {
    return raw;
  }

  // Immediate escalation.
  if (STATE_RANK[raw] > STATE_RANK[previous]) {
    return raw;
  }

  // Hysteresis on downgrade / same band.
  if (previous === "EMERGENCY") {
    return ratio < 0.9 ? raw : "EMERGENCY";
  }
  if (previous === "PROTECTION") {
    return ratio < 0.65 ? raw : "PROTECTION";
  }
  if (previous === "WARNING") {
    return ratio < 0.4 ? raw : "WARNING";
  }
  return raw;
}

export type ParseBudgetNotificationResult =
  | { readonly ok: true; readonly notification: ParsedBudgetNotification }
  | { readonly ok: false; readonly reason: string };

export function parseBudgetNotificationPayload(raw: unknown): ParseBudgetNotificationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "payload_not_object" };
  }
  const data = raw as Record<string, unknown>;
  const costAmount = toFiniteNumber(data.costAmount);
  const budgetAmount = toFiniteNumber(data.budgetAmount);
  if (costAmount === null || costAmount < 0) {
    return { ok: false, reason: "invalid_costAmount" };
  }
  if (budgetAmount === null || budgetAmount <= 0) {
    return { ok: false, reason: "invalid_budgetAmount" };
  }

  const alertThresholdExceeded = optionalFiniteNumber(data.alertThresholdExceeded);
  const forecastThresholdExceeded = optionalFiniteNumber(data.forecastThresholdExceeded);
  const budgetDisplayName =
    typeof data.budgetDisplayName === "string" && data.budgetDisplayName.trim()
      ? data.budgetDisplayName.trim()
      : null;
  const currencyCode =
    typeof data.currencyCode === "string" && data.currencyCode.trim()
      ? data.currencyCode.trim()
      : null;
  const billingPeriodStart =
    typeof data.costIntervalStart === "string" && data.costIntervalStart.trim()
      ? data.costIntervalStart.trim()
      : null;

  return {
    ok: true,
    notification: {
      budgetDisplayName,
      costAmount,
      budgetAmount,
      ratio: costAmount / budgetAmount,
      currencyCode,
      billingPeriodStart,
      alertThresholdExceeded,
      forecastThresholdExceeded,
    },
  };
}

export type ApplyBudgetNotificationInput = Readonly<{
  readonly previous: BudgetObservation | null;
  readonly notification: ParsedBudgetNotification;
  readonly messageId?: string | null;
  /** Pub/Sub publishTime / CloudEvent time when available (ISO). */
  readonly observedAt?: string | null;
  readonly nowIso?: string;
  readonly projectId?: string;
}>;

export type ApplyBudgetNotificationResult = Readonly<{
  readonly action: "applied" | "ignored_duplicate" | "ignored_stale" | "ignored_uninterpretable";
  readonly next: BudgetObservation | null;
  readonly previousState: BillingProtectionState;
  readonly newState: BillingProtectionState;
  readonly reason: string;
}>;

/**
 * Ordering strategy (documented):
 * 1. billingPeriodStart (costIntervalStart) — newer period wins / resets hysteresis
 * 2. observedAt (Pub/Sub publishTime) when both sides have it
 * 3. fallback within the same period: costAmount must be >= lastCostAmount
 *    (spend is treated as non-decreasing; lower cost without newer publishTime = stale)
 *
 * Trust boundary: Pub/Sub topic subscription (budget notifications do not include projectId).
 */
export function applyBudgetNotification(
  input: ApplyBudgetNotificationInput,
): ApplyBudgetNotificationResult {
  const previous = input.previous;
  const previousState: BillingProtectionState = previous?.state ?? "NORMAL";
  const notification = input.notification;
  const messageId = input.messageId?.trim() || null;
  const observedAt = input.observedAt?.trim() || null;
  const nowIso = input.nowIso ?? new Date().toISOString();

  if (messageId && previous?.messageId && messageId === previous.messageId) {
    return {
      action: "ignored_duplicate",
      next: previous,
      previousState,
      newState: previousState,
      reason: "duplicate_message_id",
    };
  }

  const incomingPeriod = notification.billingPeriodStart;
  const storedPeriod = previous?.billingPeriodStart ?? null;

  if (incomingPeriod && storedPeriod) {
    const incomingMs = Date.parse(incomingPeriod);
    const storedMs = Date.parse(storedPeriod);
    if (Number.isFinite(incomingMs) && Number.isFinite(storedMs) && incomingMs < storedMs) {
      return {
        action: "ignored_stale",
        next: previous,
        previousState,
        newState: previousState,
        reason: "older_billing_period",
      };
    }
  }

  const newBillingPeriod = Boolean(
    incomingPeriod && (!storedPeriod || Date.parse(incomingPeriod) > Date.parse(storedPeriod)),
  );

  if (!newBillingPeriod && storedPeriod && incomingPeriod && incomingPeriod === storedPeriod) {
    if (observedAt && previous?.lastObservedAt) {
      const incomingObs = Date.parse(observedAt);
      const storedObs = Date.parse(previous.lastObservedAt);
      if (Number.isFinite(incomingObs) && Number.isFinite(storedObs) && incomingObs < storedObs) {
        return {
          action: "ignored_stale",
          next: previous,
          previousState,
          newState: previousState,
          reason: "older_publish_time",
        };
      }
    } else if (
      typeof previous?.lastCostAmount === "number" &&
      notification.costAmount < previous.lastCostAmount
    ) {
      return {
        action: "ignored_stale",
        next: previous,
        previousState,
        newState: previousState,
        reason: "lower_cost_without_newer_timestamp",
      };
    }
  }

  if (!incomingPeriod && !storedPeriod) {
    // No period identity: still guard with publishTime / costAmount when possible.
    if (observedAt && previous?.lastObservedAt) {
      const incomingObs = Date.parse(observedAt);
      const storedObs = Date.parse(previous.lastObservedAt);
      if (Number.isFinite(incomingObs) && Number.isFinite(storedObs) && incomingObs < storedObs) {
        return {
          action: "ignored_stale",
          next: previous,
          previousState,
          newState: previousState,
          reason: "older_publish_time",
        };
      }
    }
  }

  const newState = resolveBillingProtectionState({
    ratio: notification.ratio,
    previousState: newBillingPeriod ? "NORMAL" : previousState,
    newBillingPeriod,
    forecastThresholdExceeded: notification.forecastThresholdExceeded,
  });

  const next: BudgetObservation = {
    state: newState,
    updatedAt: nowIso,
    source: "budget_pubsub",
    budgetRatio: notification.ratio,
    ...(notification.alertThresholdExceeded !== null
      ? { rawThreshold: notification.alertThresholdExceeded }
      : {}),
    ...(messageId ? { messageId } : {}),
    previousState,
    // Preserve manual override fields — budget updates base state only.
    ...(previous?.overrideState ? { overrideState: previous.overrideState } : {}),
    ...(previous?.overrideUntil ? { overrideUntil: previous.overrideUntil } : {}),
    ...(previous?.overrideBy ? { overrideBy: previous.overrideBy } : {}),
    reason: newBillingPeriod
      ? "budget_pubsub_new_period"
      : `budget_pubsub_ratio_${notification.ratio.toFixed(4)}`,
    ...(incomingPeriod ? { billingPeriodStart: incomingPeriod } : {}),
    lastCostAmount: notification.costAmount,
    ...(observedAt ? { lastObservedAt: observedAt } : {}),
    ...(notification.currencyCode ? { currencyCode: notification.currencyCode } : {}),
    ...(notification.forecastThresholdExceeded !== null
      ? { forecastRatio: notification.forecastThresholdExceeded }
      : {}),
  };

  return {
    action: "applied",
    next,
    previousState,
    newState,
    reason: next.reason ?? "budget_pubsub",
  };
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function optionalFiniteNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  return toFiniteNumber(value);
}
