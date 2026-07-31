import {
  assertPasswordPolicy,
  type ChangeOwnerEmailInput,
  type ChangeOwnerPasswordInput,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  isValidEmailFormat,
  normalizeEmail,
  type OwnerAccountProvisioner,
  type ProvisionOwnerAccountInput,
  type ProvisionOwnerAccountResult,
} from "@eduatlas/application";
import type { Auth as AdminAuth } from "firebase-admin/auth";
import {
  createIdentityToolkitClient,
  type IdentityToolkitClient,
  IdentityToolkitRequestError,
} from "./identity-toolkit-client";

export type FirebaseOwnerAccountProvisionerOptions = {
  adminAuth: AdminAuth;
  identityToolkit?: IdentityToolkitClient;
};

/**
 * Admin Auth provisioning for claim approval + owner password/email change.
 */
export class FirebaseOwnerAccountProvisioner implements OwnerAccountProvisioner {
  private readonly adminAuth: AdminAuth;
  private readonly identityToolkit: IdentityToolkitClient;

  constructor(options: FirebaseOwnerAccountProvisionerOptions) {
    this.adminAuth = options.adminAuth;
    this.identityToolkit = options.identityToolkit ?? createIdentityToolkitClient();
  }

  async provisionOwnerWithPassword(
    input: ProvisionOwnerAccountInput,
  ): Promise<ProvisionOwnerAccountResult> {
    assertPasswordPolicy(input.password);
    const email = normalizeEmail(input.email);
    const displayName = input.displayName?.trim();

    try {
      const existing = await this.adminAuth.getUserByEmail(email);
      await this.adminAuth.updateUser(existing.uid, {
        password: input.password,
        emailVerified: true,
        disabled: false,
        ...(displayName ? { displayName } : {}),
      });
      await this.adminAuth.setCustomUserClaims(existing.uid, { role: "owner" });
      return Object.freeze({ userId: existing.uid, email, created: false });
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    const created = await this.adminAuth.createUser({
      email,
      password: input.password,
      emailVerified: true,
      disabled: false,
      ...(displayName ? { displayName } : {}),
    });
    await this.adminAuth.setCustomUserClaims(created.uid, { role: "owner" });
    return Object.freeze({ userId: created.uid, email, created: true });
  }

  async changePassword(input: ChangeOwnerPasswordInput): Promise<void> {
    assertPasswordPolicy(input.newPassword);
    const email = normalizeEmail(input.email);
    try {
      await this.identityToolkit.signInWithPassword(email, input.currentPassword);
    } catch (error) {
      if (error instanceof IdentityToolkitRequestError) {
        throw new InvalidCredentialsError("Mevcut şifre hatalı.");
      }
      throw error;
    }
    const user = await this.adminAuth.getUserByEmail(email);
    await this.adminAuth.updateUser(user.uid, { password: input.newPassword });
  }

  async changeEmail(input: ChangeOwnerEmailInput): Promise<void> {
    const currentEmail = normalizeEmail(input.currentEmail);
    const newEmail = normalizeEmail(input.newEmail);

    if (!isValidEmailFormat(newEmail)) {
      throw new InvalidCredentialsError("Geçerli bir e-posta adresi girin.");
    }
    if (newEmail === currentEmail) {
      throw new InvalidCredentialsError("Yeni e-posta mevcut adresle aynı olamaz.");
    }

    try {
      await this.identityToolkit.signInWithPassword(currentEmail, input.currentPassword);
    } catch (error) {
      if (error instanceof IdentityToolkitRequestError) {
        throw new InvalidCredentialsError("Mevcut şifre hatalı.");
      }
      throw error;
    }

    try {
      await this.adminAuth.getUserByEmail(newEmail);
      throw new EmailAlreadyInUseError();
    } catch (error) {
      if (error instanceof EmailAlreadyInUseError) {
        throw error;
      }
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    const user = await this.adminAuth.getUserByEmail(currentEmail);
    try {
      await this.adminAuth.updateUser(user.uid, {
        email: newEmail,
        emailVerified: true,
      });
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      if (code === "auth/email-already-exists") {
        throw new EmailAlreadyInUseError();
      }
      throw error;
    }
  }
}

export function createFirebaseOwnerAccountProvisioner(
  options: FirebaseOwnerAccountProvisionerOptions,
): FirebaseOwnerAccountProvisioner {
  return new FirebaseOwnerAccountProvisioner(options);
}
