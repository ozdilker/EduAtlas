import { EmailNotVerifiedError, UnauthorizedError, verifySession } from "@eduatlas/application";
import {
  type AppRole,
  type CurrentUser,
  canAccessAdminPortal,
  canAccessOwnerPortal,
  canAccessParentPortal,
  type Session,
} from "@eduatlas/domain";
import { cookies } from "next/headers";
import { getAuthenticationService } from "./authentication-service";
import { SESSION_COOKIE_NAME } from "./session-cookie";

export type AuthGateReason =
  | "unauthenticated"
  | "session_expired"
  | "email_unverified"
  | "forbidden";

/**
 * Reads and verifies the HttpOnly session cookie via AuthenticationService.
 * Roles come only from the verified session — never from client state.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  try {
    return await verifySession(decodeURIComponent(raw), {
      authenticationService: getAuthenticationService(),
    });
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export type RequireAuthOptions = {
  requireEmailVerified?: boolean;
  allowedRoles?: readonly AppRole[];
};

export async function requireSession(options: RequireAuthOptions = {}): Promise<Session> {
  const session = await getCurrentSession();
  if (!session) {
    throw new UnauthorizedError("Oturum gerekli.");
  }

  if (options.requireEmailVerified !== false && !session.user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

  if (options.allowedRoles && !options.allowedRoles.includes(session.user.role)) {
    throw new UnauthorizedError();
  }

  return session;
}

export async function requireOwnerSession(): Promise<Session> {
  const session = await requireSession({ requireEmailVerified: true });
  if (!canAccessOwnerPortal(session.user.role)) {
    throw new UnauthorizedError("Kurum paneli için yetkiniz yok.");
  }
  return session;
}

export async function requireAdminSession(): Promise<Session> {
  const session = await requireSession({ requireEmailVerified: true });
  if (!canAccessAdminPortal(session.user.role)) {
    throw new UnauthorizedError("Yönetim paneli için yetkiniz yok.");
  }
  return session;
}

export async function requireParentSession(): Promise<Session> {
  const session = await requireSession({ requireEmailVerified: true });
  if (!canAccessParentPortal(session.user.role)) {
    throw new UnauthorizedError("Veli profili için yetkiniz yok.");
  }
  return session;
}
