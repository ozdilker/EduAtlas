import { getFirebaseEmulatorConfig, shouldUseFirebaseEmulators } from "@eduatlas/config";
import type { FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";

let emulatorsConnected = false;

/**
 * Connects Auth, Firestore, Storage, and Functions to local emulators when enabled.
 * Safe to call multiple times; connections run once per process.
 */
export function connectClientEmulatorsIfEnabled(app: FirebaseApp): void {
  if (emulatorsConnected || !shouldUseFirebaseEmulators()) {
    return;
  }

  const config = getFirebaseEmulatorConfig();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app);

  connectAuthEmulator(auth, `http://${config.host}:${config.authPort}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(firestore, config.host, config.firestorePort);
  connectStorageEmulator(storage, config.host, config.storagePort);
  connectFunctionsEmulator(functions, config.host, config.functionsPort);

  emulatorsConnected = true;
}

/**
 * Test helper to allow re-running emulator connection logic.
 */
export function resetClientEmulatorConnectionForTests(): void {
  emulatorsConnected = false;
}
