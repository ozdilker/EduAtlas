import { describe, expect, it } from "vitest";
import { initializeClientAppCheck } from "./app-check";

describe("initializeClientAppCheck", () => {
  it("skips when App Check is not configured", () => {
    const previous = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;

    expect(initializeClientAppCheck()).toEqual({
      status: "skipped",
      reason: "not-configured",
    });

    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
    } else {
      process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY = previous;
    }
  });

  it("defers activation when a site key is present", () => {
    const previous = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
    process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY = "test-site-key";

    expect(initializeClientAppCheck()).toEqual({
      status: "skipped",
      reason: "deferred",
    });

    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
    } else {
      process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY = previous;
    }
  });
});
