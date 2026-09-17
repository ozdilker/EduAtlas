import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getGaMeasurementId,
  isAnalyticsEnabled,
  sanitizeAnalyticsParams,
  trackEvent,
} from "./track-event";

describe("analytics track-event", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    // @ts-expect-error test cleanup
    delete globalThis.window;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reads G- measurement id from Firebase env convention", () => {
    expect(
      getGaMeasurementId({ NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-ABC123XYZ" }),
    ).toBe("G-ABC123XYZ");
    expect(getGaMeasurementId({ NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "not-a-ga-id" })).toBeNull();
  });

  it("enables analytics only in production with valid measurement id", () => {
    expect(
      isAnalyticsEnabled({
        NODE_ENV: "development",
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-ABC123XYZ",
      }),
    ).toBe(false);
    expect(
      isAnalyticsEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-ABC123XYZ",
      }),
    ).toBe(true);
  });

  it("strips PII keys and email-like values", () => {
    const safe = sanitizeAnalyticsParams({
      institution_id: "inst_1",
      email: "a@b.com",
      phone: "+905551112233",
      parent_name: "Ali",
      message: "hello",
      city_id: "istanbul",
      note: "safe@looks.like.email",
    });
    expect(safe).toEqual({
      institution_id: "inst_1",
      city_id: "istanbul",
    });
  });

  it("trackEvent is fail-open and no-ops without window/gtag", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-ABC123XYZ");
    expect(() => trackEvent("institution_view", { institution_id: "x" })).not.toThrow();
  });

  it("trackEvent calls gtag in production when available", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-ABC123XYZ");
    const gtag = vi.fn();
    // @ts-expect-error test window stub
    globalThis.window = { gtag };
    trackEvent("institution_view", {
      institution_id: "inst_1",
      email: "secret@x.com",
    });
    expect(gtag).toHaveBeenCalledWith("event", "institution_view", {
      institution_id: "inst_1",
    });
  });
});
