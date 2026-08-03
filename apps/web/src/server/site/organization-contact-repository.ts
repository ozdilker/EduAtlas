import type { OrganizationContactRepository } from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createFirestoreOrganizationContactRepository,
  createInMemoryOrganizationContactRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

let organizationContactRepositoryPromise: Promise<OrganizationContactRepository> | undefined;

function canUseFirebaseBackend(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;
  if (shouldUseFirebaseEmulators(env)) return true;
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export function getOrganizationContactRepository(): Promise<OrganizationContactRepository> {
  if (!organizationContactRepositoryPromise) {
    organizationContactRepositoryPromise = Promise.resolve(
      canUseFirebaseBackend()
        ? createFirestoreOrganizationContactRepository(getAdminFirestore())
        : createInMemoryOrganizationContactRepository(),
    );
  }
  return organizationContactRepositoryPromise;
}

export function resetOrganizationContactRepositoryForTests(): void {
  organizationContactRepositoryPromise = undefined;
}
