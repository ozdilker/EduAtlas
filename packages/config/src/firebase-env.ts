import { z } from "zod";

const emptyToUndefined = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const booleanFlagSchema = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return false;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return value === "true" || value === "1";
  });

const portSchema = z.coerce.number().int().min(1).max(65535);

const firebasePublicEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: emptyToUndefined(z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: emptyToUndefined(z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: emptyToUndefined(z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: emptyToUndefined(z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: emptyToUndefined(z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_APP_ID: emptyToUndefined(z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: emptyToUndefined(z.string().min(1).optional()),
  NEXT_PUBLIC_FIREBASE_USE_EMULATORS: booleanFlagSchema,
  NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: emptyToUndefined(z.string().min(1).optional()).transform(
    (value) => value ?? "127.0.0.1",
  ),
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: portSchema.default(9099),
  NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT: portSchema.default(8080),
  NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT: portSchema.default(9199),
  NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT: portSchema.default(5001),
  NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY: emptyToUndefined(z.string().min(1).optional()),
});

const firebaseServerEnvSchema = firebasePublicEnvSchema.extend({
  FIREBASE_ADMIN_PROJECT_ID: emptyToUndefined(z.string().min(1).optional()),
  FIREBASE_ADMIN_CLIENT_EMAIL: emptyToUndefined(z.string().email().optional()),
  FIREBASE_ADMIN_PRIVATE_KEY: emptyToUndefined(z.string().min(1).optional()),
  FIREBASE_ADMIN_STORAGE_BUCKET: emptyToUndefined(z.string().min(1).optional()),
});

export type FirebasePublicEnv = z.infer<typeof firebasePublicEnvSchema>;
export type FirebaseServerEnv = z.infer<typeof firebaseServerEnvSchema>;

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export type FirebaseEmulatorConfig = {
  host: string;
  authPort: number;
  firestorePort: number;
  storagePort: number;
  functionsPort: number;
};

function readFirebasePublicEnvFromProcess(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_FIREBASE_USE_EMULATORS: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS,
    NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST,
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT,
    NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT:
      process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT,
    NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT,
    NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT:
      process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT,
    NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY: process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY,
  };
}

function readFirebaseServerEnvFromProcess(): Record<string, string | undefined> {
  return {
    ...readFirebasePublicEnvFromProcess(),
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    FIREBASE_ADMIN_STORAGE_BUCKET: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
  };
}

/**
 * Validates public Firebase environment variables (safe for browser bundles).
 */
export function getFirebasePublicEnv(
  source: Record<string, string | undefined> = readFirebasePublicEnvFromProcess(),
): FirebasePublicEnv {
  return firebasePublicEnvSchema.parse(source);
}

/**
 * Validates server Firebase environment variables (includes Admin credentials).
 */
export function getFirebaseServerEnv(
  source: Record<string, string | undefined> = readFirebaseServerEnvFromProcess(),
): FirebaseServerEnv {
  return firebaseServerEnvSchema.parse(source);
}

/**
 * Returns true when all required client Firebase config values are present.
 */
export function isFirebaseClientConfigured(
  env: FirebasePublicEnv = getFirebasePublicEnv(),
): boolean {
  return Boolean(
    env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
      env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
      env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

/**
 * Builds Firebase JS SDK options from validated public env.
 * Throws when required client configuration is incomplete.
 */
export function getFirebaseClientConfig(
  env: FirebasePublicEnv = getFirebasePublicEnv(),
): FirebaseClientConfig {
  if (!isFirebaseClientConfigured(env)) {
    throw new Error(
      "Firebase client configuration is incomplete. Set NEXT_PUBLIC_FIREBASE_* variables.",
    );
  }

  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

/**
 * Emulator connection settings derived from public env.
 */
export function getFirebaseEmulatorConfig(
  env: FirebasePublicEnv = getFirebasePublicEnv(),
): FirebaseEmulatorConfig {
  return {
    host: env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST,
    authPort: env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT,
    firestorePort: env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT,
    storagePort: env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT,
    functionsPort: env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT,
  };
}

/**
 * Whether the client/server SDKs should target local emulators.
 * Emulators are never enabled in production NODE_ENV.
 */
export function shouldUseFirebaseEmulators(
  env: FirebasePublicEnv = getFirebasePublicEnv(),
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (nodeEnv === "production") {
    return false;
  }

  return env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS;
}

/**
 * Returns true when Admin credential pair is present (cert-based init).
 */
export function isFirebaseAdminCertConfigured(
  env: FirebaseServerEnv = getFirebaseServerEnv(),
): boolean {
  return Boolean(env.FIREBASE_ADMIN_CLIENT_EMAIL && env.FIREBASE_ADMIN_PRIVATE_KEY);
}
