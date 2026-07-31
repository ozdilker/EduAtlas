import {
  assertPasswordPolicy,
  InvalidCredentialsError,
  normalizeEmail,
  type OwnerAccountProvisioner,
} from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import {
  createFirebaseOwnerAccountProvisioner,
  getAdminAuth,
} from "@eduatlas/firebase/server";

let provisionerPromise: Promise<OwnerAccountProvisioner> | undefined;

function canUseFirebaseAuth(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;
  if (shouldUseFirebaseEmulators(env)) return true;
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

class InMemoryOwnerAccountProvisioner implements OwnerAccountProvisioner {
  private readonly users = new Map<string, { userId: string; password: string }>();

  async provisionOwnerWithPassword(input: {
    email: string;
    password: string;
    displayName?: string;
  }) {
    assertPasswordPolicy(input.password);
    const email = normalizeEmail(input.email);
    const existing = this.users.get(email);
    if (existing) {
      existing.password = input.password;
      return { userId: existing.userId, email, created: false };
    }
    const userId = `mem_${email.replace(/[^a-z0-9]/g, "_")}`;
    this.users.set(email, { userId, password: input.password });
    return { userId, email, created: true };
  }

  async changePassword(input: {
    email: string;
    currentPassword: string;
    newPassword: string;
  }) {
    assertPasswordPolicy(input.newPassword);
    const email = normalizeEmail(input.email);
    const existing = this.users.get(email);
    if (!existing || existing.password !== input.currentPassword) {
      throw new InvalidCredentialsError("Mevcut şifre hatalı.");
    }
    existing.password = input.newPassword;
  }
}

export function getOwnerAccountProvisioner(): Promise<OwnerAccountProvisioner> {
  if (!provisionerPromise) {
    provisionerPromise = Promise.resolve(
      canUseFirebaseAuth()
        ? createFirebaseOwnerAccountProvisioner({ adminAuth: getAdminAuth() })
        : new InMemoryOwnerAccountProvisioner(),
    );
  }
  return provisionerPromise;
}

export function resetOwnerAccountProvisionerForTests(): void {
  provisionerPromise = undefined;
}
