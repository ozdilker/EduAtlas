import { describe, expect, it } from "vitest";
import {
  getFirebaseClientConfig,
  getFirebaseEmulatorConfig,
  getFirebasePublicEnv,
  isFirebaseClientConfigured,
  shouldUseFirebaseEmulators,
} from "./firebase-env";

const completeClientEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "eduatlas-test.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "eduatlas-test",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "eduatlas-test.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1234567890",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:1234567890:web:abc",
};

describe("firebase-env", () => {
  it("reports incomplete client configuration by default", () => {
    const env = getFirebasePublicEnv({});

    expect(isFirebaseClientConfigured(env)).toBe(false);
  });

  it("builds client config when required values exist", () => {
    const env = getFirebasePublicEnv(completeClientEnv);

    expect(isFirebaseClientConfigured(env)).toBe(true);
    expect(getFirebaseClientConfig(env)).toEqual({
      apiKey: "test-api-key",
      authDomain: "eduatlas-test.firebaseapp.com",
      projectId: "eduatlas-test",
      storageBucket: "eduatlas-test.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abc",
      measurementId: undefined,
    });
  });

  it("throws when client config is requested without required values", () => {
    const env = getFirebasePublicEnv({});

    expect(() => getFirebaseClientConfig(env)).toThrow(/incomplete/i);
  });

  it("never enables emulators in production", () => {
    const env = getFirebasePublicEnv({
      ...completeClientEnv,
      NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true",
    });

    expect(shouldUseFirebaseEmulators(env, "production")).toBe(false);
    expect(shouldUseFirebaseEmulators(env, "development")).toBe(true);
  });

  it("exposes default emulator ports", () => {
    const env = getFirebasePublicEnv(completeClientEnv);

    expect(getFirebaseEmulatorConfig(env)).toEqual({
      host: "127.0.0.1",
      authPort: 9099,
      firestorePort: 8080,
      storagePort: 9199,
      functionsPort: 5001,
    });
  });
});
