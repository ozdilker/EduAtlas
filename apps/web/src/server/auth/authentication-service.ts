import {
  type AuthenticationService,
  createInMemoryAuthenticationService,
} from "@eduatlas/application";
import {
  getFirebasePublicEnv,
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  isFirebaseClientConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import { AppRole } from "@eduatlas/domain";
import { createFirebaseAuthenticationService, getAdminAuth } from "@eduatlas/firebase/server";

/**
 * Demo users for local/CI when Firebase Auth is not configured.
 * Never enabled in production.
 */
export const DEV_AUTH_SEED_USERS = Object.freeze([
  {
    email: "owner@eduatlas.dev",
    password: "owner-pass-10",
    role: AppRole.Owner,
    emailVerified: true,
    displayName: "Demo Owner",
    uid: "dev_owner_uid",
  },
  {
    email: "admin@eduatlas.dev",
    password: "admin-pass-10",
    role: AppRole.Admin,
    emailVerified: true,
    displayName: "Demo Admin",
    uid: "dev_admin_uid",
  },
  {
    email: "editor@eduatlas.dev",
    password: "editor-pass-10",
    role: AppRole.Admin,
    emailVerified: true,
    displayName: "Demo Editor",
    uid: "dev_editor_uid",
  },
  {
    email: "demo@eduatlas.dev",
    password: "demo-pass-10",
    role: AppRole.Parent,
    emailVerified: true,
    displayName: "Demo Parent",
    uid: "dev_demo_uid",
  },
] as const);

let cachedService: AuthenticationService | undefined;
let cachedMode: "firebase" | "memory" | undefined;

export function isFirebaseAuthConfigured(): boolean {
  const publicEnv = getFirebasePublicEnv();
  const serverEnv = getFirebaseServerEnv();
  if (!isFirebaseClientConfigured(publicEnv)) {
    return false;
  }
  if (shouldUseFirebaseEmulators(publicEnv)) {
    return true;
  }
  return (
    isFirebaseAdminCertConfigured(serverEnv) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

/**
 * Whether in-memory auth may be used (non-production only).
 */
export function allowInMemoryAuthFallback(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const flag = process.env.EDUATLAS_AUTH_MEMORY_FALLBACK?.trim().toLowerCase();
  if (flag === "0" || flag === "false") {
    return false;
  }
  // Default on in development/test when Firebase is not configured.
  return !isFirebaseAuthConfigured() || flag === "1" || flag === "true";
}

export function getAuthenticationServiceMode(): "firebase" | "memory" {
  if (isFirebaseAuthConfigured() && !forceMemoryAuth()) {
    return "firebase";
  }
  if (allowInMemoryAuthFallback()) {
    return "memory";
  }
  throw new Error(
    "Authentication is not configured. Set Firebase Auth env vars, or enable EDUATLAS_AUTH_MEMORY_FALLBACK for local development.",
  );
}

function forceMemoryAuth(): boolean {
  const flag = process.env.EDUATLAS_AUTH_MEMORY_FALLBACK?.trim().toLowerCase();
  return flag === "1" || flag === "true";
}

/**
 * Composition root for AuthenticationService (server-only).
 */
export function getAuthenticationService(): AuthenticationService {
  const mode = getAuthenticationServiceMode();
  if (cachedService && cachedMode === mode) {
    return cachedService;
  }

  if (mode === "firebase") {
    cachedService = createFirebaseAuthenticationService({
      adminAuth: getAdminAuth(),
    });
    cachedMode = mode;
    return cachedService;
  }

  cachedService = createInMemoryAuthenticationService({
    seedUsers: [...DEV_AUTH_SEED_USERS],
  });
  cachedMode = mode;
  return cachedService;
}

/** Test helper — clears singleton between suites. */
export function resetAuthenticationServiceForTests(): void {
  cachedService = undefined;
  cachedMode = undefined;
}
