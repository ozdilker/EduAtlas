import { describe, expect, it } from "vitest";
import {
  applyBudgetNotification,
  type BudgetObservation,
  mapRatioToBillingProtectionState,
  parseBudgetNotificationPayload,
  resolveBillingProtectionState,
} from "./billing-budget-guard-core";

describe("mapRatioToBillingProtectionState", () => {
  it("maps ratio bands", () => {
    expect(mapRatioToBillingProtectionState(0)).toBe("NORMAL");
    expect(mapRatioToBillingProtectionState(0.49)).toBe("NORMAL");
    expect(mapRatioToBillingProtectionState(0.5)).toBe("WARNING");
    expect(mapRatioToBillingProtectionState(0.74)).toBe("WARNING");
    expect(mapRatioToBillingProtectionState(0.75)).toBe("PROTECTION");
    expect(mapRatioToBillingProtectionState(0.99)).toBe("PROTECTION");
    expect(mapRatioToBillingProtectionState(1)).toBe("EMERGENCY");
    expect(mapRatioToBillingProtectionState(1.5)).toBe("EMERGENCY");
  });
});

describe("resolveBillingProtectionState", () => {
  it("escalates immediately from NORMAL", () => {
    expect(resolveBillingProtectionState({ ratio: 0.5, previousState: "NORMAL" })).toBe("WARNING");
    expect(resolveBillingProtectionState({ ratio: 0.75, previousState: "NORMAL" })).toBe(
      "PROTECTION",
    );
    expect(resolveBillingProtectionState({ ratio: 1, previousState: "NORMAL" })).toBe("EMERGENCY");
  });

  it("applies hysteresis on downgrade", () => {
    expect(resolveBillingProtectionState({ ratio: 0.74, previousState: "PROTECTION" })).toBe(
      "PROTECTION",
    );
    expect(resolveBillingProtectionState({ ratio: 0.64, previousState: "PROTECTION" })).toBe(
      "WARNING",
    );
    expect(resolveBillingProtectionState({ ratio: 0.95, previousState: "EMERGENCY" })).toBe(
      "EMERGENCY",
    );
    expect(resolveBillingProtectionState({ ratio: 0.89, previousState: "EMERGENCY" })).toBe(
      "PROTECTION",
    );
    expect(resolveBillingProtectionState({ ratio: 0.45, previousState: "WARNING" })).toBe(
      "WARNING",
    );
    expect(resolveBillingProtectionState({ ratio: 0.39, previousState: "WARNING" })).toBe("NORMAL");
  });

  it("forecast 100% elevates to PROTECTION but not EMERGENCY", () => {
    expect(
      resolveBillingProtectionState({
        ratio: 0.6,
        previousState: "NORMAL",
        forecastThresholdExceeded: 1.1,
      }),
    ).toBe("PROTECTION");
  });

  it("actual ratio >= 1 is EMERGENCY regardless of forecast", () => {
    expect(
      resolveBillingProtectionState({
        ratio: 1.1,
        previousState: "WARNING",
        forecastThresholdExceeded: 1.1,
      }),
    ).toBe("EMERGENCY");
  });

  it("new billing period resets without old hysteresis", () => {
    expect(
      resolveBillingProtectionState({
        ratio: 0,
        previousState: "EMERGENCY",
        newBillingPeriod: true,
      }),
    ).toBe("NORMAL");
  });
});

describe("parseBudgetNotificationPayload", () => {
  it("accepts valid payloads and ignores missing optionals", () => {
    const parsed = parseBudgetNotificationPayload({
      budgetDisplayName: "EduAtlas Monthly",
      costAmount: 190,
      budgetAmount: 250,
      currencyCode: "TRY",
      costIntervalStart: "2026-08-01T00:00:00Z",
      alertThresholdExceeded: 0.75,
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.notification.ratio).toBeCloseTo(0.76, 5);
  });

  it("rejects malformed payloads", () => {
    expect(parseBudgetNotificationPayload(null).ok).toBe(false);
    expect(parseBudgetNotificationPayload({ costAmount: -1, budgetAmount: 250 }).ok).toBe(false);
    expect(parseBudgetNotificationPayload({ costAmount: 10, budgetAmount: 0 }).ok).toBe(false);
  });
});

describe("applyBudgetNotification", () => {
  const period = "2026-08-01T00:00:00Z";

  function note(costAmount: number, extras: Record<string, unknown> = {}) {
    const parsed = parseBudgetNotificationPayload({
      budgetDisplayName: "EduAtlas",
      costAmount,
      budgetAmount: 250,
      currencyCode: "TRY",
      costIntervalStart: period,
      ...extras,
    });
    if (!parsed.ok) throw new Error(parsed.reason);
    return parsed.notification;
  }

  it("maps 190/250 to PROTECTION", () => {
    const result = applyBudgetNotification({
      previous: null,
      notification: note(190, { alertThresholdExceeded: 0.75 }),
      messageId: "msg-1",
      observedAt: "2026-08-10T12:00:00Z",
    });
    expect(result.action).toBe("applied");
    expect(result.newState).toBe("PROTECTION");
    expect(result.next?.budgetRatio).toBeCloseTo(0.76, 5);
  });

  it("escalates to EMERGENCY at 260/250", () => {
    const previous: BudgetObservation = {
      state: "PROTECTION",
      budgetRatio: 0.76,
      lastCostAmount: 190,
      billingPeriodStart: period,
      messageId: "msg-1",
      lastObservedAt: "2026-08-10T12:00:00Z",
    };
    const result = applyBudgetNotification({
      previous,
      notification: note(260),
      messageId: "msg-2",
      observedAt: "2026-08-10T13:00:00Z",
    });
    expect(result.newState).toBe("EMERGENCY");
  });

  it("ignores stale lower-cost message without newer publish time", () => {
    const previous: BudgetObservation = {
      state: "EMERGENCY",
      budgetRatio: 1.04,
      lastCostAmount: 260,
      billingPeriodStart: period,
      messageId: "msg-2",
    };
    const result = applyBudgetNotification({
      previous,
      notification: note(100),
      messageId: "msg-old",
    });
    expect(result.action).toBe("ignored_stale");
    expect(result.newState).toBe("EMERGENCY");
  });

  it("dedupes identical messageId", () => {
    const previous: BudgetObservation = {
      state: "PROTECTION",
      messageId: "msg-1",
      lastCostAmount: 190,
      billingPeriodStart: period,
    };
    const result = applyBudgetNotification({
      previous,
      notification: note(190),
      messageId: "msg-1",
    });
    expect(result.action).toBe("ignored_duplicate");
  });

  it("resets on new billing period", () => {
    const previous: BudgetObservation = {
      state: "EMERGENCY",
      lastCostAmount: 260,
      billingPeriodStart: "2026-07-01T00:00:00Z",
      messageId: "old",
    };
    const parsed = parseBudgetNotificationPayload({
      costAmount: 0,
      budgetAmount: 250,
      currencyCode: "TRY",
      costIntervalStart: "2026-08-01T00:00:00Z",
      budgetDisplayName: "EduAtlas",
    });
    if (!parsed.ok) throw new Error(parsed.reason);
    const result = applyBudgetNotification({
      previous,
      notification: parsed.notification,
      messageId: "new-period",
    });
    expect(result.action).toBe("applied");
    expect(result.newState).toBe("NORMAL");
  });

  it("preserves override fields while updating base state", () => {
    const previous: BudgetObservation = {
      state: "NORMAL",
      overrideState: "EMERGENCY",
      overrideUntil: "2099-01-01T00:00:00Z",
      overrideBy: "admin",
      billingPeriodStart: period,
      lastCostAmount: 10,
      messageId: "a",
    };
    const result = applyBudgetNotification({
      previous,
      notification: note(200),
      messageId: "b",
      observedAt: "2026-08-10T15:00:00Z",
    });
    expect(result.action).toBe("applied");
    expect(result.next?.state).toBe("PROTECTION");
    expect(result.next?.overrideState).toBe("EMERGENCY");
    expect(result.next?.overrideUntil).toBe("2099-01-01T00:00:00Z");
    expect(result.next?.overrideBy).toBe("admin");
  });
});
