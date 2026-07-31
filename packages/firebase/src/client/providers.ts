import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import type { Functions } from "firebase/functions";
import { getFunctions } from "firebase/functions";
import type { FirebaseStorage } from "firebase/storage";
import { getStorage } from "firebase/storage";
import { getFirebaseClientApp } from "./app";

export type FirebaseClientProviders = {
  app: ReturnType<typeof getFirebaseClientApp>;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
};

/**
 * Auth provider accessor (infrastructure only — no sign-in flows).
 */
export function getClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

/**
 * Firestore provider accessor (infrastructure only — no queries/writes).
 */
export function getClientFirestore(): Firestore {
  return getFirestore(getFirebaseClientApp());
}

/**
 * Storage provider accessor (infrastructure only).
 * Prefer `@eduatlas/firebase/storage` for upload / delete / download URL.
 */
export function getClientStorage(): FirebaseStorage {
  return getStorage(getFirebaseClientApp());
}

/**
 * Functions provider accessor (infrastructure only — no callables).
 */
export function getClientFunctions(regionOrCustomDomain?: string): Functions {
  return getFunctions(getFirebaseClientApp(), regionOrCustomDomain);
}

/**
 * Returns the full client provider surface in one call.
 */
export function getFirebaseClientProviders(regionOrCustomDomain?: string): FirebaseClientProviders {
  const app = getFirebaseClientApp();

  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
    functions: getFunctions(app, regionOrCustomDomain),
  };
}
