/**
 * HttpOnly session cookie for Firebase (or in-memory) session cookies.
 * SECURITY-ARCHITECTURE: Secure, HttpOnly, SameSite.
 */
export const SESSION_COOKIE_NAME = "__session";

export const OWNER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5; // 5 days
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type SessionCookieOptions = {
  maxAgeSeconds?: number;
  secure?: boolean;
};

export function buildSessionCookieHeader(
  value: string,
  options: SessionCookieOptions = {},
): string {
  const maxAge = options.maxAgeSeconds ?? OWNER_SESSION_MAX_AGE_SECONDS;
  const secure =
    options.secure ?? (process.env.NODE_ENV === "production" || process.env.VERCEL === "1");
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildClearSessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const parts = [`${SESSION_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
