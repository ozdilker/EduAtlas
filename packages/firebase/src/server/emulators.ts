import { getFirebaseEmulatorConfig, shouldUseFirebaseEmulators } from "@eduatlas/config";

let adminEmulatorEnvApplied = false;

/**
 * Applies standard Firebase Admin emulator environment variables when enabled.
 * Must run before Admin SDK initialization.
 */
export function applyAdminEmulatorEnv(): void {
  if (adminEmulatorEnvApplied || !shouldUseFirebaseEmulators()) {
    return;
  }

  const config = getFirebaseEmulatorConfig();

  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= `${config.host}:${config.authPort}`;
  process.env.FIRESTORE_EMULATOR_HOST ??= `${config.host}:${config.firestorePort}`;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= `${config.host}:${config.storagePort}`;

  adminEmulatorEnvApplied = true;
}

/**
 * Test helper to reset emulator env application flag.
 */
export function resetAdminEmulatorEnvForTests(): void {
  adminEmulatorEnvApplied = false;
}
