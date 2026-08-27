import { resolveEmailCtaHref } from "../notifications/resolve-email-cta-href";

const PRODUCTION_ORIGIN = "https://eduatlas.com.tr";
const PARENT_VERIFY_PATH = "/veli/giris?notice=email_verified";
const OWNER_VERIFY_PATH = "/login?notice=email_verified";

/**
 * Continue URL after Firebase email verification.
 * Never uses localhost / auth-domain placeholders — those strand users on Firebase pages.
 */
export function resolveEmailVerificationContinueUrl(input: {
  accountRole: "parent" | "owner";
  siteBaseUrl?: string;
}): string {
  const path = input.accountRole === "parent" ? PARENT_VERIFY_PATH : OWNER_VERIFY_PATH;
  const preferred = input.siteBaseUrl?.trim() ?? "";
  const originCandidate =
    !preferred || /localhost|127\.0\.0\.1|firebaseapp\.com|web\.app/i.test(preferred)
      ? PRODUCTION_ORIGIN
      : preferred;

  return (
    resolveEmailCtaHref(path, originCandidate) ??
    `${PRODUCTION_ORIGIN}${path}`
  );
}
