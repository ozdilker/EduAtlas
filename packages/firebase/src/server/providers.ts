import type { App } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { getFirebaseAdminApp } from "./app";

export type FirebaseAdminProviders = {
  app: App;
  auth: Auth;
  firestore: Firestore;
  storage: Storage;
};

/**
 * Admin Auth accessor (infrastructure only — no user management flows).
 */
export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

/**
 * Admin Firestore accessor (infrastructure only — no repository logic).
 */
export function getAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

/**
 * Admin Storage accessor (infrastructure only — no upload pipelines).
 */
export function getAdminStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}

/**
 * Returns the full Admin provider surface.
 */
export function getFirebaseAdminProviders(): FirebaseAdminProviders {
  const app = getFirebaseAdminApp();

  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
  };
}
