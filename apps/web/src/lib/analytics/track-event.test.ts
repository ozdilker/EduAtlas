import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getGaMeasurementId,
  isAnalyticsEnabled,
  sanitizeAnalyticsParams,
  trackEvent,
} from "./track-event";

describe("analytics track-event", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    // @ts-expect-error test cleanup
    delete globalThis.window;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads G- measurement id from Firebase env convention", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-ABC123XYZ");
    expect(getGaMeasurementId()).toBe("G-ABC123XYZ");

    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "not-a-ga-id");
    expect(getGaMeasurementId()).toBeNull();
  });

  it("enables analytics only in production with valid measurement id", () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-ABC123XYZ");

    vi.stubEnv("NODE_ENV", "development");
    expect(isAnalyticsEnabled()).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    expect(isAnalyticsEnabled()).toBe(true);
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
