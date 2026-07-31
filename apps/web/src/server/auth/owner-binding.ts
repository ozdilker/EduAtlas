import {
  createInMemoryOwnerBindingRepository,
  type OwnerBindingRepository,
  resolveOwnerInstitutionId,
} from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createEmptyOwnerBindingRepository,
  createFirestoreOwnerBindingRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";
import {
  getOwnerDemoInstitutionId,
  isOwnerDemoInstitutionFallbackEnabled,
} from "../owner/owner-demo-context";

let cachedBindings: OwnerBindingRepository | undefined;

function canUseFirestoreOwnerBindings(): boolean {
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

/**
 * Owner binding repository — Firestore when Admin is configured; empty otherwise.
 * No auto-bind on login or claim submit.
 */
export function getOwnerBindingRepository(): OwnerBindingRepository {
  if (!cachedBindings) {
    if (process.env.NODE_ENV === "test") {
      cachedBindings = createInMemoryOwnerBindingRepository();
    } else if (canUseFirestoreOwnerBindings()) {
      cachedBindings = createFirestoreOwnerBindingRepository(getAdminFirestore());
    } else {
      cachedBindings = createEmptyOwnerBindingRepository();
    }
  }
  return cachedBindings;
}

export async function resolveAuthenticatedOwnerInstitutionId(
  userId: string,
): Promise<string | null> {
  const result = await resolveOwnerInstitutionId(
    { userId },
    {
      ownerBindingRepository: getOwnerBindingRepository(),
      demoInstitutionId: getOwnerDemoInstitutionId(),
      allowDemoInstitutionFallback: isOwnerDemoInstitutionFallbackEnabled(),
    },
  );
  return result.institutionId;
}

export function resetOwnerBindingRepositoryForTests(): void {
  cachedBindings = undefined;
}
