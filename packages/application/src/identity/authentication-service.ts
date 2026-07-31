import type { CurrentUser, Session } from "@eduatlas/domain";

export type SignInWithEmailPasswordInput = {
  email: string;
  password: string;
};

export type SignUpWithEmailPasswordInput = {
  email: string;
  password: string;
  displayName?: string;
  /** Coarse role claim for new accounts. Defaults to owner (institution accounts). */
  role?: "owner" | "parent";
};

export type RequestPasswordResetInput = {
  email: string;
};

export type SendEmailVerificationInput = {
  idToken: string;
};

export type CreateSessionFromIdTokenInput = {
  idToken: string;
  /** Absolute session TTL in milliseconds. */
  expiresInMs?: number;
};

export type SignInResult = Readonly<{
  readonly idToken: string;
  readonly refreshToken?: string;
  readonly user: CurrentUser;
  readonly emailVerificationSent: boolean;
}>;

/**
 * Authentication port — Firebase (or test) adapter implements this.
 * UI must never import Firebase; call through server actions only.
 */
export interface AuthenticationService {
  signInWithEmailPassword(input: SignInWithEmailPasswordInput): Promise<SignInResult>;
  signUpWithEmailPassword(input: SignUpWithEmailPasswordInput): Promise<SignInResult>;
  requestPasswordReset(input: RequestPasswordResetInput): Promise<void>;
  sendEmailVerification(input: SendEmailVerificationInput): Promise<void>;
  createSessionFromIdToken(input: CreateSessionFromIdTokenInput): Promise<Session>;
  verifySessionCookie(sessionCookie: string): Promise<Session>;
  revokeSession(sessionCookie: string): Promise<void>;
}
