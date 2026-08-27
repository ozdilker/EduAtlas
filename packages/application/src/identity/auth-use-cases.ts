import type { Session } from "@eduatlas/domain";
import {
  emitEmailVerification,
  emitPasswordReset,
  emitWelcome,
} from "../notifications/emit-notification-events";
import type { NotificationService } from "../notifications/notification-service";
import type {
  AuthenticationService,
  CreateSessionFromIdTokenInput,
  RequestPasswordResetInput,
  SignInResult,
  SignInWithEmailPasswordInput,
  SignUpWithEmailPasswordInput,
} from "./authentication-service";
import { AuthenticationError } from "./errors";
import { assertPasswordPolicy, isValidEmailFormat, normalizeEmail } from "./password-policy";
import { resolveEmailVerificationContinueUrl } from "./resolve-email-verification-continue-url";

export type SignInDependencies = {
  authenticationService: AuthenticationService;
  sessionExpiresInMs?: number;
  notificationService?: NotificationService;
  /** Public site origin for parent email-verification continue URL. */
  siteBaseUrl?: string;
};

export type SignInWithSessionResult = Readonly<{
  readonly signIn: SignInResult;
  readonly session: Session;
}>;

export async function signInWithEmailPassword(
  input: SignInWithEmailPasswordInput,
  deps: SignInDependencies,
): Promise<SignInWithSessionResult> {
  const email = normalizeEmail(input.email);
  if (!isValidEmailFormat(email)) {
    throw new AuthenticationError("Geçerli bir e-posta adresi girin.");
  }
  if (!input.password) {
    throw new AuthenticationError("Şifre gerekli.");
  }

  const signIn = await deps.authenticationService.signInWithEmailPassword({
    email,
    password: input.password,
  });
  const session = await deps.authenticationService.createSessionFromIdToken({
    idToken: signIn.idToken,
    expiresInMs: deps.sessionExpiresInMs,
  });

  return Object.freeze({ signIn, session });
}

export async function signUpWithEmailPassword(
  input: SignUpWithEmailPasswordInput,
  deps: SignInDependencies,
): Promise<SignInWithSessionResult> {
  const email = normalizeEmail(input.email);
  if (!isValidEmailFormat(email)) {
    throw new AuthenticationError("Geçerli bir e-posta adresi girin.");
  }
  assertPasswordPolicy(input.password);

  const accountRole = input.role === "parent" ? "parent" : "owner";
  const signIn = await deps.authenticationService.signUpWithEmailPassword({
    email,
    password: input.password,
    displayName: input.displayName?.trim(),
    role: accountRole,
  });

  let verificationLink: string | undefined;
  if (accountRole === "parent") {
    try {
      const continueUrl = resolveEmailVerificationContinueUrl({
        accountRole: "parent",
        siteBaseUrl: deps.siteBaseUrl,
      });
      verificationLink = await deps.authenticationService.generateEmailVerificationLink({
        email,
        continueUrl,
      });
    } catch {
      // Fall back to Firebase's default verification email if link generation fails.
      if (signIn.idToken) {
        try {
          await deps.authenticationService.sendEmailVerification({ idToken: signIn.idToken });
        } catch {
          // Best-effort.
        }
      }
    }
  } else if (signIn.idToken) {
    try {
      await deps.authenticationService.sendEmailVerification({ idToken: signIn.idToken });
    } catch {
      // Verification email is best-effort; account still created.
    }
  }

  if (deps.notificationService) {
    try {
      await emitWelcome(deps.notificationService, {
        userId: signIn.user.uid,
        email: signIn.user.email,
        accountRole,
      });
      if (accountRole === "parent") {
        // Branded SMTP verification mail (skips Firebase default template when link exists).
        await emitEmailVerification(deps.notificationService, {
          userId: signIn.user.uid,
          email: signIn.user.email,
          accountRole: "parent",
          verificationLink,
        });
      } else {
        // In-app only — Firebase Identity Toolkit already sends the verify link email.
        await emitEmailVerification(deps.notificationService, {
          userId: signIn.user.uid,
          accountRole: "owner",
        });
      }
    } catch {
      // Fail-open: account already created.
    }
  }

  const session = await deps.authenticationService.createSessionFromIdToken({
    idToken: signIn.idToken,
    expiresInMs: deps.sessionExpiresInMs,
  });

  return Object.freeze({
    signIn: Object.freeze({ ...signIn, emailVerificationSent: true }),
    session,
  });
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
  deps: {
    authenticationService: AuthenticationService;
    notificationService?: NotificationService;
  },
): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!isValidEmailFormat(email)) {
    // Avoid unauthenticated email enumeration: act as success for invalid format
    // only when empty; otherwise surface validation.
    throw new AuthenticationError("Geçerli bir e-posta adresi girin.");
  }
  await deps.authenticationService.requestPasswordReset({ email });

  if (deps.notificationService) {
    try {
      await emitPasswordReset(deps.notificationService, {
        userId: `email_${email.replace(/[^a-z0-9]/g, "_")}`,
        email,
      });
    } catch {
      // Fail-open: provider reset already requested.
    }
  }
}

export async function verifySession(
  sessionCookie: string,
  deps: { authenticationService: AuthenticationService },
): Promise<Session> {
  const cookie = sessionCookie.trim();
  if (!cookie) {
    throw new AuthenticationError("Oturum bulunamadı.");
  }
  return deps.authenticationService.verifySessionCookie(cookie);
}

export async function revokeSession(
  sessionCookie: string,
  deps: { authenticationService: AuthenticationService },
): Promise<void> {
  const cookie = sessionCookie.trim();
  if (!cookie) {
    return;
  }
  await deps.authenticationService.revokeSession(cookie);
}

export type { CreateSessionFromIdTokenInput };
