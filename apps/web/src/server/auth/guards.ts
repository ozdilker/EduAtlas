import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  type AuthGateReason,
  getCurrentSession,
  requireAdminSession,
  requireOwnerSession,
  requireParentSession,
} from "./current-session";
import { SESSION_COOKIE_NAME } from "./session-cookie";

function loginRedirect(pathname: string, reason: AuthGateReason, loginPath = "/login"): never {
  const params = new URLSearchParams();
  params.set("next", pathname);
  params.set("reason", reason);
  redirect(`${loginPath}?${params.toString()}`);
}

/**
 * Protects /owner/* — server-authoritative; redirects unauthenticated users.
 */
export async function assertOwnerPortalAccess(pathname = "/owner"): Promise<void> {
  const jar = await cookies();
  const hasCookie = Boolean(jar.get(SESSION_COOKIE_NAME)?.value);
  const session = await getCurrentSession();

  if (!session) {
    loginRedirect(pathname, hasCookie ? "session_expired" : "unauthenticated");
  }

  try {
    await requireOwnerSession();
  } catch {
    if (!session.user.emailVerified) {
      loginRedirect(pathname, "email_unverified");
    }
    loginRedirect(pathname, "forbidden");
  }
}

/**
 * Protects /admin/* — admin claim required from verified session.
 */
export async function assertAdminPortalAccess(pathname = "/admin"): Promise<void> {
  const jar = await cookies();
  const hasCookie = Boolean(jar.get(SESSION_COOKIE_NAME)?.value);
  const session = await getCurrentSession();

  if (!session) {
    loginRedirect(pathname, hasCookie ? "session_expired" : "unauthenticated");
  }

  try {
    await requireAdminSession();
  } catch {
    if (!session.user.emailVerified) {
      loginRedirect(pathname, "email_unverified");
    }
    loginRedirect(pathname, "forbidden");
  }
}

/**
 * Protects /veli/* authenticated pages — parent session + verified email required.
 */
export async function assertParentPortalAccess(pathname = "/veli"): Promise<void> {
  const jar = await cookies();
  const hasCookie = Boolean(jar.get(SESSION_COOKIE_NAME)?.value);
  const session = await getCurrentSession();

  if (!session) {
    loginRedirect(pathname, hasCookie ? "session_expired" : "unauthenticated", "/veli/giris");
  }

  try {
    await requireParentSession();
  } catch {
    if (!session.user.emailVerified) {
      loginRedirect(pathname, "email_unverified", "/veli/giris");
    }
    loginRedirect(pathname, "forbidden", "/veli/giris");
  }
}
