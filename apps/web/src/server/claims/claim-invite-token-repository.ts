import {
  createInMemoryClaimInviteTokenRepository,
  type ClaimInviteTokenRepository,
} from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createFirestoreClaimInviteTokenRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

let claimInviteTokenRepositoryPromise: Promise<ClaimInviteTokenRepository> | undefined;

function canUseFirebaseBackend(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return false;
  }
  if (shouldUseFirebaseEmulators(env)) {
    return true;
  }
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export function getClaimInviteTokenRepository(): Promise<ClaimInviteTokenRepository> {
  if (!claimInviteTokenRepositoryPromise) {
    claimInviteTokenRepositoryPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreClaimInviteTokenRepository(getAdminFirestore())
        : createInMemoryClaimInviteTokenRepository(),
    );
  }
  return claimInviteTokenRepositoryPromise;
}

export function resetClaimInviteTokenRepositoryForTests(): void {
  claimInviteTokenRepositoryPromise = undefined;
}
