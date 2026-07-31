import { getFirebaseClientConfig, isFirebaseClientConfigured } from "@eduatlas/config";
import type { FirebaseApp } from "firebase/app";
import { getApps, initializeApp } from "firebase/app";
import { connectClientEmulatorsIfEnabled } from "./emulators";

let clientApp: FirebaseApp | undefined;

/**
 * Returns whether the client Firebase app can be initialized from env.
 */
export function canInitializeFirebaseClientApp(): boolean {
  return isFirebaseClientConfigured();
}

/**
 * Lazily initializes (or reuses) the Firebase JS SDK app.
 * Production-safe: singleton via getApps(); no-op side effects until called.
 */
export function getFirebaseClientApp(): FirebaseApp {
  if (clientApp) {
    return clientApp;
  }

  const existing = getApps()[0];
  if (existing) {
    clientApp = existing;
    return clientApp;
  }

  clientApp = initializeApp(getFirebaseClientConfig());
  connectClientEmulatorsIfEnabled(clientApp);
  return clientApp;
}

/**
 * Returns the default app if already initialized; otherwise undefined.
 */
export function peekFirebaseClientApp(): FirebaseApp | undefined {
  if (clientApp) {
    return clientApp;
  }

  return getApps()[0];
}

/**
 * Clears the local singleton reference (tests only).
 * Does not delete the underlying Firebase app instance.
 */
export function resetFirebaseClientAppForTests(): void {
  clientApp = undefined;
}

/**
 * Convenience accessor when an app is already known to exist.
 */
export function requireFirebaseClientApp(): FirebaseApp {
  return getFirebaseClientApp();
}
