import { type BillingProtection, createBillingProtection } from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import {
  assertOperationAllowed,
  getBillingProtection,
  setBillingProtection,
} from "./billing-protection";
import type { BillingProtectionRepository } from "./billing-protection-repository";
import { isBillingProtectionError } from "./errors";
import { isBillingOperationBlocked } from "./operations";

function memoryRepo(seed: BillingProtection | null = null): BillingProtectionRepository {
  let current = seed;
  return {
    async get() {
      return current;
    },
    async save(protection) {
      current = protection;
      return protection;
    },
  };
}

describe("isBillingOperationBlocked", () => {
  const protectedOps = [
    "SITEMAP_SCAN",
    "IMPORT_DUPLICATE_SCAN",
    "ACQUISITION_FULL_SCAN",
    "OUTREACH_PREPARE",
    "ADMIN_FREE_TEXT",
  ] as const;

  it("NORMAL allows everything", () => {
    for (const op of [...protectedOps, "AI_HEAVY_OPERATION"] as const) {
      expect(isBillingOperationBlocked("NORMAL", op)).toBe(false);
    }
  });

  it("WARNING allows everything", () => {
    for (const op of [...protectedOps, "AI_HEAVY_OPERATION"] as const) {
      expect(isBillingOperationBlocked("WARNING", op)).toBe(false);
    }
  });

  it("PROTECTION rejects protected ops but not AI-only", () => {
    for (const op of protectedOps) {
      expect(isBillingOperationBlocked("PROTECTION", op)).toBe(true);
    }
    expect(isBillingOperationBlocked("PROTECTION", "AI_HEAVY_OPERATION")).toBe(false);
  });

  it("EMERGENCY rejects protected ops and AI", () => {
    for (const op of [...protectedOps, "AI_HEAVY_OPERATION"] as const) {
      expect(isBillingOperationBlocked("EMERGENCY", op)).toBe(true);
    }
  });
});

describe("getBillingProtection", () => {
  it("returns NORMAL when repository is omitted", async () => {
    const protection = await getBillingProtection({});
    expect(protection.state).toBe("NORMAL");
  });

  it("returns NORMAL when document is missing", async () => {
    const protection = await getBillingProtection({
      billingProtectionRepository: memoryRepo(null),
    });
    expect(protection.state).toBe("NORMAL");
  });

  it("returns NORMAL when read throws (fail-open)", async () => {
    const repo: BillingProtectionRepository = {
      async get() {
        throw new Error("unavailable");
      },
      async save() {
        throw new Error("unavailable");
      },
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const protection = await getBillingProtection({ billingProtectionRepository: repo });
    expect(protection.state).toBe("NORMAL");
    warn.mockRestore();
  });

  it("returns stored state", async () => {
    const protection = await getBillingProtection({
      billingProtectionRepository: memoryRepo(
        createBillingProtection({ state: "PROTECTION", source: "manual" }),
      ),
    });
    expect(protection.state).toBe("PROTECTION");
  });
});

describe("assertOperationAllowed", () => {
  it("allows under NORMAL", async () => {
    await expect(
      assertOperationAllowed("SITEMAP_SCAN", {
        billingProtectionRepository: memoryRepo(createBillingProtection({ state: "NORMAL" })),
      }),
    ).resolves.toBeUndefined();
  });

  it("allows under WARNING", async () => {
    await expect(
      assertOperationAllowed("IMPORT_DUPLICATE_SCAN", {
        billingProtectionRepository: memoryRepo(createBillingProtection({ state: "WARNING" })),
      }),
    ).resolves.toBeUndefined();
  });

  it("blocks SITEMAP_SCAN under PROTECTION", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      assertOperationAllowed("SITEMAP_SCAN", {
        billingProtectionRepository: memoryRepo(createBillingProtection({ state: "PROTECTION" })),
      }),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        isBillingProtectionError(error) &&
        error.code === "OPERATION_BLOCKED_BY_BILLING_PROTECTION" &&
        error.operation === "SITEMAP_SCAN"
      );
    });
    warn.mockRestore();
  });

  it("blocks AI only under EMERGENCY", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      assertOperationAllowed("AI_HEAVY_OPERATION", {
        billingProtectionRepository: memoryRepo(createBillingProtection({ state: "PROTECTION" })),
      }),
    ).resolves.toBeUndefined();

    await expect(
      assertOperationAllowed("AI_HEAVY_OPERATION", {
        billingProtectionRepository: memoryRepo(createBillingProtection({ state: "EMERGENCY" })),
      }),
    ).rejects.toSatisfy(isBillingProtectionError);
    warn.mockRestore();
  });

  it("honors active override", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      assertOperationAllowed("OUTREACH_PREPARE", {
        billingProtectionRepository: memoryRepo(
          createBillingProtection({
            state: "NORMAL",
            overrideState: "PROTECTION",
            overrideUntil: "2099-01-01T00:00:00.000Z",
          }),
        ),
      }),
    ).rejects.toSatisfy(isBillingProtectionError);
    warn.mockRestore();
  });
});

describe("setBillingProtection", () => {
  it("persists state and previousState", async () => {
    const repo = memoryRepo(createBillingProtection({ state: "WARNING" }));
    const saved = await setBillingProtection(
      { state: "PROTECTION", source: "manual", reason: "phase1_test" },
      { billingProtectionRepository: repo },
    );
    expect(saved.state).toBe("PROTECTION");
    expect(saved.previousState).toBe("WARNING");
    expect(saved.reason).toBe("phase1_test");
    expect((await repo.get())?.state).toBe("PROTECTION");
  });
});
