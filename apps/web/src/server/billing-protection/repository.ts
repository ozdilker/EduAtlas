import type { BillingProtectionRepository } from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import { requestCacheAsync } from "@eduatlas/firebase/cache";
import {
  createFirestoreBillingProtectionRepository,
  createInMemoryBillingProtectionRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

let billingProtectionRepositoryPromise: Promise<BillingProtectionRepository> | undefined;

function canUseFirebaseBackend(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;
  if (shouldUseFirebaseEmulators(env)) return true;
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export function getBillingProtectionRepository(): Promise<BillingProtectionRepository> {
  if (!billingProtectionRepositoryPromise) {
    billingProtectionRepositoryPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreBillingProtectionRepository(getAdminFirestore())
        : createInMemoryBillingProtectionRepository(),
    );
  }
  return billingProtectionRepositoryPromise;
}

export function resetBillingProtectionRepositoryForTests(): void {
  billingProtectionRepositoryPromise = undefined;
}

/**
 * Request-memoized read of billing protection deps for server routes.
 */
export const getBillingProtectionDeps = requestCacheAsync(async () => {
  const billingProtectionRepository = await getBillingProtectionRepository();
  return { billingProtectionRepository };
});
