import { AppRole, type Session } from "@eduatlas/domain";
import { redirect } from "next/navigation";
import { getCurrentSession } from "./current-session";

function homePathForRole(role: Session["user"]["role"]): string {
  if (role === AppRole.Admin) {
    return "/admin";
  }
  if (role === AppRole.Parent) {
    return "/veli";
  }
  return "/owner";
}

/**
 * When a session already exists, bounce away from login/register forms.
 * Prevents re-login without logout and keeps portal CTAs consistent.
 */
export async function redirectIfAuthenticated(
  options: {
    /** Prefer this path when the current role may use it. */
    preferredNext?: string;
  } = {},
): Promise<void> {
  const session = await getCurrentSession();
  if (!session) {
    return;
  }

  // Unverified sessions must not enter portals — send them to the matching login
  // with a notice instead of creating a redirect loop.
  if (!session.user.emailVerified) {
    return;
  }

  const home = homePathForRole(session.user.role);
  const preferred = options.preferredNext?.trim();
  if (preferred?.startsWith("/") && !preferred.startsWith("//")) {
    if (session.user.role === AppRole.Parent && preferred.startsWith("/veli")) {
      redirect(preferred);
    }
    if (session.user.role === AppRole.Owner && preferred.startsWith("/owner")) {
      redirect(preferred);
    }
    if (session.user.role === AppRole.Admin && preferred.startsWith("/admin")) {
      redirect(preferred);
    }
  }
  redirect(home);
}
