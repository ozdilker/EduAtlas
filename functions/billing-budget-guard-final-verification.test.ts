/**
 * Final verification scenarios for Phase 2 billingBudgetGuard (local only).
 * Does not publish to production Pub/Sub or create real billing spend.
 */
import { describe, expect, it } from "vitest";
import {
  applyBudgetNotification,
  type BudgetObservation,
  mapRatioToBillingProtectionState,
  parseBudgetNotificationPayload,
  resolveBillingProtectionState,
} from "./billing-budget-guard-core";

const BUDGET = 250;
const PERIOD = "2026-08-01T00:00:00Z";

function notification(costAmount: number, extras: Record<string, unknown> = {}) {
  const parsed = parseBudgetNotificationPayload({
    budgetDisplayName: "₺250 Monthly Budget Alert",
    costAmount,
    budgetAmount: BUDGET,
    currencyCode: "TRY",
    costIntervalStart: PERIOD,
    budgetAmountType: "SPECIFIED_AMOUNT",
    ...extras,
  });
  if (!parsed.ok) throw new Error(parsed.reason);
  return parsed.notification;
}

describe("final verification: ratio bands", () => {
  it("0.40 → NORMAL", () => {
    expect(mapRatioToBillingProtectionState(0.4)).toBe("NORMAL");
    expect(
      applyBudgetNotification({ previous: null, notification: notification(100), messageId: "r40" })
        .newState,
    ).toBe("NORMAL");
  });

  it("0.60 → WARNING", () => {
    expect(mapRatioToBillingProtectionState(0.6)).toBe("WARNING");
    expect(
      applyBudgetNotification({ previous: null, notification: notification(150), messageId: "r60" })
        .newState,
    ).toBe("WARNING");
  });

  it("0.80 → PROTECTION", () => {
    expect(mapRatioToBillingProtectionState(0.8)).toBe("PROTECTION");
    expect(
      applyBudgetNotification({ previous: null, notification: notification(200), messageId: "r80" })
        .newState,
    ).toBe("PROTECTION");
  });

  it("1.00 → EMERGENCY", () => {
    expect(mapRatioToBillingProtectionState(1)).toBe("EMERGENCY");
    expect(
      applyBudgetNotification({
        previous: null,
        notification: notification(250),
        messageId: "r100",
      }).newState,
    ).toBe("EMERGENCY");
  });
});

describe("final verification: forecast + hysteresis", () => {
  it("forecast >= 1.0 with actual < 1.0 is at most PROTECTION", () => {
    expect(
      resolveBillingProtectionState({
        ratio: 0.6,
        previousState: "NORMAL",
        forecastThresholdExceeded: 1.0,
      }),
    ).toBe("PROTECTION");
    expect(
      resolveBillingProtectionState({
        ratio: 0.6,
        previousState: "NORMAL",
        forecastThresholdExceeded: 1.0,
      }),
    ).not.toBe("EMERGENCY");
  });

  it("EMERGENCY holds at ratio >= 0.90 and recovers below 0.90 per design", () => {
    expect(resolveBillingProtectionState({ ratio: 0.95, previousState: "EMERGENCY" })).toBe(
      "EMERGENCY",
    );
    expect(resolveBillingProtectionState({ ratio: 0.9, previousState: "EMERGENCY" })).toBe(
      "EMERGENCY",
    );
    // Design: remain EMERGENCY until ratio < 0.90 → 0.89 recovers to PROTECTION
    expect(resolveBillingProtectionState({ ratio: 0.89, previousState: "EMERGENCY" })).toBe(
      "PROTECTION",
    );
    expect(resolveBillingProtectionState({ ratio: 0.88, previousState: "EMERGENCY" })).toBe(
      "PROTECTION",
    );
    expect(resolveBillingProtectionState({ ratio: 0.8, previousState: "EMERGENCY" })).toBe(
      "PROTECTION",
    );
  });

  it("PROTECTION recovers below 0.65", () => {
    expect(resolveBillingProtectionState({ ratio: 0.65, previousState: "PROTECTION" })).toBe(
      "PROTECTION",
    );
    expect(resolveBillingProtectionState({ ratio: 0.64, previousState: "PROTECTION" })).toBe(
      "WARNING",
    );
    expect(resolveBillingProtectionState({ ratio: 0.39, previousState: "PROTECTION" })).toBe(
      "NORMAL",
    );
  });
});

describe("final verification: ordering + malformed", () => {
  const emergencyPrev: BudgetObservation = {
    state: "EMERGENCY",
    lastCostAmount: 260,
    billingPeriodStart: PERIOD,
    messageId: "msg-new",
    lastObservedAt: "2026-08-10T12:00:00Z",
  };

  it("duplicate messageId does not change state", () => {
    const result = applyBudgetNotification({
      previous: emergencyPrev,
      notification: notification(260),
      messageId: "msg-new",
      observedAt: "2026-08-10T12:00:00Z",
    });
    expect(result.action).toBe("ignored_duplicate");
    expect(result.newState).toBe("EMERGENCY");
  });

  it("older publishTime does not overwrite", () => {
    const result = applyBudgetNotification({
      previous: emergencyPrev,
      notification: notification(100),
      messageId: "msg-old",
      observedAt: "2026-08-10T11:00:00Z",
    });
    expect(result.action).toBe("ignored_stale");
    expect(result.newState).toBe("EMERGENCY");
  });

  it("older billing period is ignored", () => {
    const parsed = parseBudgetNotificationPayload({
      budgetDisplayName: "₺250 Monthly Budget Alert",
      costAmount: 10,
      budgetAmount: BUDGET,
      currencyCode: "TRY",
      costIntervalStart: "2026-07-01T00:00:00Z",
    });
    if (!parsed.ok) throw new Error(parsed.reason);
    const result = applyBudgetNotification({
      previous: emergencyPrev,
      notification: parsed.notification,
      messageId: "old-period",
    });
    expect(result.action).toBe("ignored_stale");
  });

  it("new billing period resets hysteresis", () => {
    const parsed = parseBudgetNotificationPayload({
      budgetDisplayName: "₺250 Monthly Budget Alert",
      costAmount: 0,
      budgetAmount: BUDGET,
      currencyCode: "TRY",
      costIntervalStart: "2026-09-01T00:00:00Z",
    });
    if (!parsed.ok) throw new Error(parsed.reason);
    const result = applyBudgetNotification({
      previous: emergencyPrev,
      notification: parsed.notification,
      messageId: "new-period",
    });
    expect(result.action).toBe("applied");
    expect(result.newState).toBe("NORMAL");
  });

  it("malformed payload leaves state unchanged", () => {
    expect(parseBudgetNotificationPayload({ hello: true }).ok).toBe(false);
    expect(parseBudgetNotificationPayload(null).ok).toBe(false);
  });
});
