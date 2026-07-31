import {
  AppRole,
  appRoleFromClaims,
  type CurrentUser,
  createCurrentUser,
  createSession,
  type Session,
} from "@eduatlas/domain";
import type {
  AuthenticationService,
  CreateSessionFromIdTokenInput,
  RequestPasswordResetInput,
  SendEmailVerificationInput,
  SignInResult,
  SignInWithEmailPasswordInput,
  SignUpWithEmailPasswordInput,
} from "./authentication-service";
import { EmailAlreadyInUseError, InvalidCredentialsError, SessionExpiredError } from "./errors";
import { assertPasswordPolicy, normalizeEmail } from "./password-policy";

type StoredUser = {
  uid: string;
  email: string;
  password: string;
  emailVerified: boolean;
  displayName?: string;
  claims: Record<string, unknown>;
};

type StoredSession = {
  cookie: string;
  expiresAt: string;
  user: CurrentUser;
  revoked: boolean;
};

export type InMemoryAuthenticationServiceOptions = {
  seedUsers?: ReadonlyArray<{
    email: string;
    password: string;
    role?: AppRole;
    emailVerified?: boolean;
    displayName?: string;
    uid?: string;
  }>;
  now?: () => Date;
};

/**
 * Deterministic auth for tests and local development without Firebase.
 * Not for production.
 */
export class InMemoryAuthenticationService implements AuthenticationService {
  private readonly usersByEmail = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, StoredSession>();
  private readonly idTokens = new Map<string, string>();
  private readonly passwordResetEmails: string[] = [];
  private readonly verificationEmails: string[] = [];
  private readonly now: () => Date;
  private seq = 0;

  constructor(options: InMemoryAuthenticationServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
    for (const seed of options.seedUsers ?? []) {
      const email = normalizeEmail(seed.email);
      const uid = seed.uid ?? `mem_${email.replace(/[^a-z0-9]/g, "_")}`;
      const role = seed.role ?? AppRole.Owner;
      this.usersByEmail.set(email, {
        uid,
        email,
        password: seed.password,
        emailVerified: seed.emailVerified ?? true,
        displayName: seed.displayName,
        claims: { role },
      });
    }
  }

  get passwordResetRequests(): readonly string[] {
    return this.passwordResetEmails;
  }

  get verificationRequests(): readonly string[] {
    return this.verificationEmails;
  }

  async signInWithEmailPassword(input: SignInWithEmailPasswordInput): Promise<SignInResult> {
    const email = normalizeEmail(input.email);
    const user = this.usersByEmail.get(email);
    if (!user || user.password !== input.password) {
      throw new InvalidCredentialsError();
    }
    return this.toSignInResult(user, false);
  }

  async signUpWithEmailPassword(input: SignUpWithEmailPasswordInput): Promise<SignInResult> {
    const email = normalizeEmail(input.email);
    assertPasswordPolicy(input.password);
    if (this.usersByEmail.has(email)) {
      throw new EmailAlreadyInUseError();
    }
    const uid = `mem_${++this.seq}_${Date.now()}`;
    const role = input.role === "parent" ? AppRole.Parent : AppRole.Owner;
    const user: StoredUser = {
      uid,
      email,
      password: input.password,
      emailVerified: false,
      displayName: input.displayName?.trim(),
      claims: { role },
    };
    this.usersByEmail.set(email, user);
    return this.toSignInResult(user, true);
  }

  async requestPasswordReset(input: RequestPasswordResetInput): Promise<void> {
    const email = normalizeEmail(input.email);
    this.passwordResetEmails.push(email);
    // Always succeed to avoid email enumeration.
  }

  async sendEmailVerification(input: SendEmailVerificationInput): Promise<void> {
    const uid = this.idTokens.get(input.idToken);
    if (!uid) {
      return;
    }
    const user = [...this.usersByEmail.values()].find((entry) => entry.uid === uid);
    if (user) {
      this.verificationEmails.push(user.email);
      user.emailVerified = true;
    }
  }

  async createSessionFromIdToken(input: CreateSessionFromIdTokenInput): Promise<Session> {
    const uid = this.idTokens.get(input.idToken);
    if (!uid) {
      throw new InvalidCredentialsError("Geçersiz kimlik jetonu.");
    }
    const stored = [...this.usersByEmail.values()].find((entry) => entry.uid === uid);
    if (!stored) {
      throw new InvalidCredentialsError("Kullanıcı bulunamadı.");
    }

    const expiresInMs = input.expiresInMs ?? 5 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(this.now().getTime() + expiresInMs).toISOString();
    const cookie = `mem_session_${++this.seq}_${uid}`;
    const user = this.toCurrentUser(stored);
    const session = createSession({ sessionCookie: cookie, expiresAt, user });
    this.sessions.set(cookie, { cookie, expiresAt, user, revoked: false });
    return session;
  }

  async verifySessionCookie(sessionCookie: string): Promise<Session> {
    const stored = this.sessions.get(sessionCookie.trim());
    if (!stored || stored.revoked) {
      throw new SessionExpiredError();
    }
    if (Date.parse(stored.expiresAt) <= this.now().getTime()) {
      throw new SessionExpiredError();
    }
    return createSession({
      sessionCookie: stored.cookie,
      expiresAt: stored.expiresAt,
      user: stored.user,
    });
  }

  async revokeSession(sessionCookie: string): Promise<void> {
    const stored = this.sessions.get(sessionCookie.trim());
    if (stored) {
      stored.revoked = true;
    }
  }

  private toSignInResult(user: StoredUser, emailVerificationSent: boolean): SignInResult {
    const idToken = `mem_id_${++this.seq}_${user.uid}`;
    this.idTokens.set(idToken, user.uid);
    return Object.freeze({
      idToken,
      refreshToken: `mem_refresh_${user.uid}`,
      user: this.toCurrentUser(user),
      emailVerificationSent,
    });
  }

  private toCurrentUser(user: StoredUser): CurrentUser {
    return createCurrentUser({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      role: appRoleFromClaims(user.claims),
      displayName: user.displayName,
    });
  }
}

export function createInMemoryAuthenticationService(
  options?: InMemoryAuthenticationServiceOptions,
): InMemoryAuthenticationService {
  return new InMemoryAuthenticationService(options);
}
