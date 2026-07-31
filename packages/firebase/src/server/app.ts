import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  type App,
  type AppOptions,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { applyAdminEmulatorEnv } from "./emulators";

let adminApp: App | undefined;

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n");
}

function buildAdminOptions(): AppOptions {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket =
    env.FIREBASE_ADMIN_STORAGE_BUCKET ?? env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId) {
    throw new Error(
      "Firebase Admin project ID is missing. Set FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }

  if (shouldUseFirebaseEmulators(env)) {
    return {
      projectId,
      storageBucket,
    };
  }

  if (isFirebaseAdminCertConfigured(env)) {
    return {
      credential: cert({
        projectId,
        clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL as string,
        privateKey: normalizePrivateKey(env.FIREBASE_ADMIN_PRIVATE_KEY as string),
      }),
      projectId,
      storageBucket,
    };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {
      credential: applicationDefault(),
      projectId,
      storageBucket,
    };
  }

  throw new Error(
    "Firebase Admin configuration is incomplete. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS.",
  );
}

/**
 * Lazily initializes the Firebase Admin app (server-only).
 */
export function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  applyAdminEmulatorEnv();
  adminApp = initializeApp(buildAdminOptions());
  return adminApp;
}

/**
 * Returns the Admin app if already initialized.
 */
export function peekFirebaseAdminApp(): App | undefined {
  if (adminApp) {
    return adminApp;
  }

  return getApps()[0];
}

/**
 * Test helper to clear the Admin singleton reference.
 */
export function resetFirebaseAdminAppForTests(): void {
  adminApp = undefined;
}
