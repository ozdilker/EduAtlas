import { describe, expect, it } from "vitest";
import { applyAdminEmulatorEnv, resetAdminEmulatorEnvForTests } from "./emulators";

describe("applyAdminEmulatorEnv", () => {
  it("sets emulator host env vars when emulators are enabled", () => {
    resetAdminEmulatorEnvForTests();

    const previousUse = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS;
    const previousNodeEnv = process.env.NODE_ENV;
    const previousAuth = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const previousFirestore = process.env.FIRESTORE_EMULATOR_HOST;
    const previousStorage = process.env.FIREBASE_STORAGE_EMULATOR_HOST;

    process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS = "true";
    process.env.NODE_ENV = "development";
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;

    applyAdminEmulatorEnv();

    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe("127.0.0.1:9099");
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe("127.0.0.1:8080");
    expect(process.env.FIREBASE_STORAGE_EMULATOR_HOST).toBe("127.0.0.1:9199");

    if (previousUse === undefined) {
      delete process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS;
    } else {
      process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS = previousUse;
    }

    process.env.NODE_ENV = previousNodeEnv;

    if (previousAuth === undefined) {
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    } else {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = previousAuth;
    }

    if (previousFirestore === undefined) {
      delete process.env.FIRESTORE_EMULATOR_HOST;
    } else {
      process.env.FIRESTORE_EMULATOR_HOST = previousFirestore;
    }

    if (previousStorage === undefined) {
      delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    } else {
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = previousStorage;
    }

    resetAdminEmulatorEnvForTests();
  });
});
