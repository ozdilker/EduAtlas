import type { CurrentUser } from "./current-user";

/**
 * Server-side session abstraction backed by an HttpOnly cookie value.
 * The cookie contents are opaque to the UI (Firebase session cookie).
 */
export type Session = Readonly<{
  readonly sessionCookie: string;
  readonly expiresAt: string;
  readonly user: CurrentUser;
}>;

export type CreateSessionInput = {
  sessionCookie: string;
  expiresAt: string;
  user: CurrentUser;
};

export function createSession(input: CreateSessionInput): Session {
  const sessionCookie = input.sessionCookie.trim();
  if (!sessionCookie) {
    throw new Error("Session.sessionCookie is required.");
  }
  if (Number.isNaN(Date.parse(input.expiresAt))) {
    throw new Error("Session.expiresAt must be a valid ISO timestamp.");
  }

  return Object.freeze({
    sessionCookie,
    expiresAt: input.expiresAt,
    user: input.user,
  });
}

export function isSessionExpired(
  session: Session,
  now: string = new Date().toISOString(),
): boolean {
  return Date.parse(session.expiresAt) <= Date.parse(now);
}
