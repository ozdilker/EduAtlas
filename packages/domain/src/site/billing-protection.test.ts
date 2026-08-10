import { describe, expect, it } from "vitest";
import {
  createBillingProtection,
  createDefaultBillingProtection,
  isBillingProtectionState,
  resolveEffectiveBillingProtectionState,
} from "./billing-protection";

describe("billing-protection domain", () => {
  it("accepts NORMAL WARNING PROTECTION EMERGENCY", () => {
    for (const state of ["NORMAL", "WARNING", "PROTECTION", "EMERGENCY"] as const) {
      expect(isBillingProtectionState(state)).toBe(true);
      expect(createBillingProtection({ state }).state).toBe(state);
    }
  });

  it("rejects invalid state", () => {
    expect(() => createBillingProtection({ state: "PANIC" as "NORMAL" })).toThrow(/invalid/i);
  });

  it("default missing-document state is NORMAL", () => {
    expect(createDefaultBillingProtection("2026-08-10T00:00:00.000Z").state).toBe("NORMAL");
  });

  it("override wins until expiry", () => {
    const protection = createBillingProtection({
      state: "NORMAL",
      overrideState: "PROTECTION",
      overrideUntil: "2099-01-01T00:00:00.000Z",
    });
    expect(resolveEffectiveBillingProtectionState(protection)).toBe("PROTECTION");
  });

  it("expired override falls back to state", () => {
    const protection = createBillingProtection({
      state: "WARNING",
      overrideState: "EMERGENCY",
      overrideUntil: "2000-01-01T00:00:00.000Z",
    });
    expect(resolveEffectiveBillingProtectionState(protection)).toBe("WARNING");
  });
});
