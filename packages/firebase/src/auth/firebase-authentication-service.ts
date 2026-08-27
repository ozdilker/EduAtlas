import {
  type AuthenticationService,
  assertPasswordPolicy,
  type CreateSessionFromIdTokenInput,
  EmailAlreadyInUseError,
  type GenerateEmailVerificationLinkInput,
  InvalidCredentialsError,
  normalizeEmail,
  type RequestPasswordResetInput,
  type SendEmailVerificationInput,
  SessionExpiredError,
  type SignInResult,
  type SignInWithEmailPasswordInput,
  type SignUpWithEmailPasswordInput,
  WeakPasswordError,
} from "@eduatlas/application";
import {
  appRoleFromClaims,
  type CurrentUser,
  createCurrentUser,
  createSession,
  type Session,
} from "@eduatlas/domain";
import type { Auth as AdminAuth } from "firebase-admin/auth";
import {
  createIdentityToolkitClient,
  type IdentityToolkitClient,
  IdentityToolkitRequestError,
} from "./identity-toolkit-client";

const DEFAULT_SESSION_MS = 5 * 24 * 60 * 60 * 1000;

export type FirebaseAuthenticationServiceOptions = {
  adminAuth: AdminAuth;
  identityToolkit?: IdentityToolkitClient;
};

/**
 * Firebase Auth adapter: Identity Toolkit REST + Admin session cookies.
 * Safe for server composition roots only — never import from UI.
 */
export class FirebaseAuthenticationService implements AuthenticationService {
  private readonly adminAuth: AdminAuth;
  private readonly identityToolkit: IdentityToolkitClient;

  constructor(options: FirebaseAuthenticationServiceOptions) {
    this.adminAuth = options.adminAuth;
    this.identityToolkit = options.identityToolkit ?? createIdentityToolkitClient();
  }

  async signInWithEmailPassword(input: SignInWithEmailPasswordInput): Promise<SignInResult> {
    try {
      const response = await this.identityToolkit.signInWithPassword(
        normalizeEmail(input.email),
        input.password,
      );
      const user = await this.resolveUser(response.idToken, response.localId, response.email, {
        displayName: response.displayName,
      });
      return Object.freeze({
        idToken: response.idToken,
        refreshToken: response.refreshToken,
        user,
        emailVerificationSent: false,
      });
    } catch (error) {
      throw mapIdentityToolkitError(error);
    }
  }

  async signUpWithEmailPassword(input: SignUpWithEmailPasswordInput): Promise<SignInResult> {
    assertPasswordPolicy(input.password);
    try {
      const response = await this.identityToolkit.signUp(
        normalizeEmail(input.email),
        input.password,
        input.displayName,
      );
      const roleClaim = input.role === "parent" ? "parent" : "owner";
      await this.adminAuth.setCustomUserClaims(response.localId, { role: roleClaim });
      const user = await this.resolveUser(response.idToken, response.localId, response.email, {
        displayName: input.displayName ?? response.displayName,
        emailVerified: false,
        roleOverride: roleClaim === "parent" ? "parent" : "owner",
      });
      return Object.freeze({
        idToken: response.idToken,
        refreshToken: response.refreshToken,
        user,
        emailVerificationSent: false,
      });
    } catch (error) {
      throw mapIdentityToolkitError(error);
    }
  }

  async requestPasswordReset(input: RequestPasswordResetInput): Promise<void> {
    try {
      await this.identityToolkit.sendPasswordResetEmail(normalizeEmail(input.email));
    } catch (error) {
      // Avoid email enumeration for EMAIL_NOT_FOUND.
      if (
        error instanceof IdentityToolkitRequestError &&
        /EMAIL_NOT_FOUND|USER_NOT_FOUND/i.test(error.firebaseCode)
      ) {
        return;
      }
      throw mapIdentityToolkitError(error);
    }
  }

  async sendEmailVerification(input: SendEmailVerificationInput): Promise<void> {
    try {
      await this.identityToolkit.sendEmailVerification(input.idToken);
    } catch (error) {
      throw mapIdentityToolkitError(error);
    }
  }

  async generateEmailVerificationLink(
    input: GenerateEmailVerificationLinkInput,
  ): Promise<string> {
    try {
      return await this.adminAuth.generateEmailVerificationLink(normalizeEmail(input.email), {
        url: input.continueUrl.trim(),
        handleCodeInApp: false,
      });
    } catch (error) {
      throw mapIdentityToolkitError(error);
    }
  }

  async createSessionFromIdToken(input: CreateSessionFromIdTokenInput): Promise<Session> {
    const expiresInMs = input.expiresInMs ?? DEFAULT_SESSION_MS;
    try {
      const sessionCookie = await this.adminAuth.createSessionCookie(input.idToken, {
        expiresIn: expiresInMs,
      });
      const decoded = await this.adminAuth.verifySessionCookie(sessionCookie, true);
      const user = await this.currentUserFromUid(decoded);
      return createSession({
        sessionCookie,
        expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
        user,
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsError || error instanceof WeakPasswordError) {
        throw error;
      }
      throw new InvalidCredentialsError("Oturum oluşturulamadı. Lütfen yeniden giriş yapın.");
    }
  }

  async verifySessionCookie(sessionCookie: string): Promise<Session> {
    try {
      const decoded = await this.adminAuth.verifySessionCookie(sessionCookie, true);
      const expiresAtMs =
        typeof decoded.exp === "number" ? decoded.exp * 1000 : Date.now() + DEFAULT_SESSION_MS;
      if (expiresAtMs <= Date.now()) {
        throw new SessionExpiredError();
      }
      return createSession({
        sessionCookie,
        expiresAt: new Date(expiresAtMs).toISOString(),
        user: await this.currentUserFromUid(decoded),
      });
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        throw error;
      }
      throw new SessionExpiredError();
    }
  }

  async revokeSession(sessionCookie: string): Promise<void> {
    try {
      const decoded = await this.adminAuth.verifySessionCookie(sessionCookie, true);
      await this.adminAuth.revokeRefreshTokens(decoded.sub);
    } catch {
      // Already invalid — treat as logged out.
    }
  }

  private async currentUserFromUid(decoded: {
    uid?: string;
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    [key: string]: unknown;
  }): Promise<CurrentUser> {
    const uid = decoded.uid ?? decoded.sub;
    if (!uid || !decoded.email) {
      throw new SessionExpiredError();
    }
    try {
      const record = await this.adminAuth.getUser(uid);
      return createCurrentUser({
        uid: record.uid,
        email: record.email ?? decoded.email,
        emailVerified: record.emailVerified,
        role: appRoleFromClaims(record.customClaims ?? {}),
        displayName: record.displayName ?? (typeof decoded.name === "string" ? decoded.name : undefined),
      });
    } catch {
      return currentUserFromDecoded(decoded);
    }
  }

  private async resolveUser(
    idToken: string,
    localId: string,
    email: string,
    hints?: { displayName?: string; emailVerified?: boolean; roleOverride?: "owner" | "parent" },
  ): Promise<CurrentUser> {
    try {
      const record = await this.adminAuth.getUser(localId);
      const claims = {
        ...(record.customClaims ?? {}),
        ...(hints?.roleOverride ? { role: hints.roleOverride } : {}),
      };
      return createCurrentUser({
        uid: record.uid,
        email: record.email ?? email,
        emailVerified: record.emailVerified,
        role: appRoleFromClaims(claims),
        displayName: record.displayName ?? hints?.displayName,
      });
    } catch {
      const lookup = await this.identityToolkit.lookupAccount(idToken);
      const claims = {
        ...parseCustomAttributes(lookup.customAttributes),
        ...(hints?.roleOverride ? { role: hints.roleOverride } : {}),
      };
      return createCurrentUser({
        uid: lookup.localId,
        email: lookup.email,
        emailVerified: hints?.emailVerified ?? lookup.emailVerified,
        role: appRoleFromClaims(claims),
        displayName: lookup.displayName ?? hints?.displayName,
      });
    }
  }
}

function currentUserFromDecoded(decoded: {
  uid?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  [key: string]: unknown;
}): CurrentUser {
  const uid = decoded.uid ?? decoded.sub;
  if (!uid || !decoded.email) {
    throw new SessionExpiredError();
  }
  return createCurrentUser({
    uid,
    email: decoded.email,
    emailVerified: Boolean(decoded.email_verified),
    role: appRoleFromClaims(decoded),
    displayName: typeof decoded.name === "string" ? decoded.name : undefined,
  });
}

function parseCustomAttributes(raw: string | undefined): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function mapIdentityToolkitError(error: unknown): Error {
  if (
    error instanceof InvalidCredentialsError ||
    error instanceof EmailAlreadyInUseError ||
    error instanceof WeakPasswordError ||
    error instanceof SessionExpiredError
  ) {
    return error;
  }

  const code =
    error instanceof IdentityToolkitRequestError
      ? error.firebaseCode
      : error instanceof Error
        ? error.message
        : "UNKNOWN";

  if (/EMAIL_EXISTS|EMAIL_ALREADY_IN_USE/i.test(code)) {
    return new EmailAlreadyInUseError();
  }
  if (/WEAK_PASSWORD|PASSWORD_DOES_NOT_MEET/i.test(code)) {
    return new WeakPasswordError();
  }
  if (
    /INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|USER_NOT_FOUND|INVALID_EMAIL|INVALID_ID_TOKEN/i.test(
      code,
    )
  ) {
    return new InvalidCredentialsError();
  }

  return new InvalidCredentialsError("Kimlik doğrulama başarısız oldu.");
}

export function createFirebaseAuthenticationService(
  options: FirebaseAuthenticationServiceOptions,
): FirebaseAuthenticationService {
  return new FirebaseAuthenticationService(options);
}
