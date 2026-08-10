import { createBillingProtection } from "@eduatlas/domain";
import { describe, expect, it, vi } from "vitest";
import {
  BILLING_PROTECTION_CACHE_TTL_MS,
  BILLING_PROTECTION_DOC_ID,
  createInMemoryBillingProtectionRepository,
  FirestoreBillingProtectionRepository,
} from "./firestore-billing-protection-repository";
import { SITE_SETTINGS_COLLECTION } from "./firestore-homepage-visuals-repository";

describe("InMemoryBillingProtectionRepository", () => {
  it("returns null when empty and persists saves", async () => {
    const repo = createInMemoryBillingProtectionRepository();
    expect(await repo.get()).toBeNull();
    const saved = await repo.save(
      createBillingProtection({ state: "PROTECTION", source: "manual" }),
    );
    expect(saved.state).toBe("PROTECTION");
    expect((await repo.get())?.state).toBe("PROTECTION");
  });
});

describe("FirestoreBillingProtectionRepository", () => {
  it("reads and writes site_settings/billing_protection", async () => {
    const get = vi.fn(async () => ({
      exists: true,
      data: () => ({
        state: "WARNING",
        updatedAt: "2026-08-10T00:00:00.000Z",
        source: "manual",
      }),
    }));
    const set = vi.fn(async () => undefined);
    const doc = vi.fn(() => ({ get, set }));
    const collection = vi.fn(() => ({ doc }));
    const db = { collection } as never;

    const repo = new FirestoreBillingProtectionRepository(db);
    const current = await repo.get();
    expect(current?.state).toBe("WARNING");
    expect(collection).toHaveBeenCalledWith(SITE_SETTINGS_COLLECTION);
    expect(doc).toHaveBeenCalledWith(BILLING_PROTECTION_DOC_ID);

    await repo.save(
      createBillingProtection({
        state: "EMERGENCY",
        source: "manual",
        reason: "test",
        updatedAt: "2026-08-10T01:00:00.000Z",
      }),
    );
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        state: "EMERGENCY",
        source: "manual",
        reason: "test",
      }),
      { merge: false },
    );
  });

  it("returns null when document is missing", async () => {
    const get = vi.fn(async () => ({ exists: false, data: () => undefined }));
    const doc = vi.fn(() => ({ get, set: vi.fn() }));
    const collection = vi.fn(() => ({ doc }));
    const db = { collection } as never;

    const repo = new FirestoreBillingProtectionRepository(db);
    expect(await repo.get()).toBeNull();
  });

  it("uses a short TTL suitable for the circuit breaker", () => {
    expect(BILLING_PROTECTION_CACHE_TTL_MS).toBeLessThanOrEqual(60_000);
    expect(BILLING_PROTECTION_CACHE_TTL_MS).toBeGreaterThanOrEqual(30_000);
  });
});
