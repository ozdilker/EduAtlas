import { getFirebasePublicEnv } from "@eduatlas/config";

export type AppCheckInitializationResult =
  | { status: "skipped"; reason: "not-configured" | "deferred" }
  | { status: "unsupported" };

/**
 * Future App Check entry point.
 *
 * Per SECURITY-ARCHITECTURE, App Check will gate public callables.
 * This sprint keeps the hook ready without activating providers.
 */
export function initializeClientAppCheck(): AppCheckInitializationResult {
  const env = getFirebasePublicEnv();

  if (!env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY) {
    return { status: "skipped", reason: "not-configured" };
  }

  // Future: initializeAppCheck(getFirebaseClientApp(), {
  //   provider: new ReCaptchaV3Provider(env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY),
  //   isTokenAutoRefreshEnabled: true,
  // });
  return { status: "skipped", reason: "deferred" };
}
