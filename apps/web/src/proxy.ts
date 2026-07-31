import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "__session";

/**
 * Edge gate: cookie presence for privileged routes.
 * Full AuthZ (claims, emailVerified, role) is server-authoritative in layouts/actions.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isOwner = pathname.startsWith("/owner");
  const isAdmin = pathname.startsWith("/admin");

  if (!isOwner && !isAdmin) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (session) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", pathname);
  loginUrl.searchParams.set("reason", "unauthenticated");
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/owner/:path*", "/admin/:path*"],
};
