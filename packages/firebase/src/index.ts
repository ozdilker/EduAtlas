/**
 * @eduatlas/firebase
 *
 * Infrastructure-only Firebase package.
 * Import client APIs from `@eduatlas/firebase/client`.
 * Import Admin APIs from `@eduatlas/firebase/server` (server-only).
 */

export type { AppCheckInitializationResult, FirebaseClientProviders } from "./client";
export {
  canInitializeFirebaseClientApp,
  getFirebaseClientApp,
  initializeClientAppCheck,
  peekFirebaseClientApp,
} from "./client";
