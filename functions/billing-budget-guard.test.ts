import { describe, expect, it, vi } from "vitest";
import { parseBudgetNotificationPayload } from "./billing-budget-guard-core";
import { processBillingBudgetMessage } from "./billing-budget-guard-process";

type DocState = Record<string, unknown> | null;

function createFakeFirestore(initial: DocState = null) {
  let current: DocState = initial ? { ...initial } : null;

  const db = {
    collection() {
      return {
        doc() {
          return { path: "site_settings/billing_protection" };
        },
      };
    },
    async runTransaction(fn: (tx: unknown) => Promise<void>) {
      const tx = {
        async get() {
          return {
            exists: current !== null,
            data: () => (current ? { ...current } : undefined),
          };
        },
        set(_ref: unknown, data: Record<string, unknown>) {
          current = { ...data };
        },
      };
      await fn(tx);
    },
    getState() {
      return current;
    },
  };

  return db;
}

describe("processBillingBudgetMessage integration", () => {
  it("writes PROTECTION then EMERGENCY and ignores stale lower cost", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const db = createFakeFirestore();

    const first = await processBillingBudgetMessage(db, {
      payload: {
        budgetDisplayName: "EduAtlas Monthly",
        costAmount: 190,
        budgetAmount: 250,
        currencyCode: "TRY",
        costIntervalStart: "2026-08-01T00:00:00Z",
        alertThresholdExceeded: 0.75,
      },
      messageId: "m1",
      publishTime: "2026-08-10T10:00:00Z",
      projectId: "eduatlas-dev",
    });
    expect(first.outcome).toBe("processed");
    expect(first.apply?.newState).toBe("PROTECTION");
    expect(db.getState()?.state).toBe("PROTECTION");

    const second = await processBillingBudgetMessage(db, {
      payload: {
        budgetDisplayName: "EduAtlas Monthly",
        costAmount: 260,
        budgetAmount: 250,
        currencyCode: "TRY",
        costIntervalStart: "2026-08-01T00:00:00Z",
      },
      messageId: "m2",
      publishTime: "2026-08-10T11:00:00Z",
      projectId: "eduatlas-dev",
    });
    expect(second.apply?.newState).toBe("EMERGENCY");
    expect(db.getState()?.state).toBe("EMERGENCY");

    const stale = await processBillingBudgetMessage(db, {
      payload: {
        budgetDisplayName: "EduAtlas Monthly",
        costAmount: 100,
        budgetAmount: 250,
        currencyCode: "TRY",
        costIntervalStart: "2026-08-01T00:00:00Z",
      },
      messageId: "m-stale",
      projectId: "eduatlas-dev",
    });
    expect(stale.outcome).toBe("ignored_stale");
    expect(db.getState()?.state).toBe("EMERGENCY");

    warn.mockRestore();
    info.mockRestore();
  });

  it("acknowledges malformed payloads without writing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const db = createFakeFirestore();
    const result = await processBillingBudgetMessage(db, {
      payload: { hello: "world" },
      messageId: "bad",
    });
    expect(result.outcome).toBe("invalid");
    expect(db.getState()).toBeNull();
    warn.mockRestore();
  });

  it("parse helper matches integration fixture ratio", () => {
    const parsed = parseBudgetNotificationPayload({
      costAmount: 190,
      budgetAmount: 250,
      currencyCode: "TRY",
      costIntervalStart: "2026-08-01T00:00:00Z",
      budgetDisplayName: "EduAtlas",
      alertThresholdExceeded: 0.75,
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.notification.ratio).toBeCloseTo(0.76, 5);
    }
  });
});
