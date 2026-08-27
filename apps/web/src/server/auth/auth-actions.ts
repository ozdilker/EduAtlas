"use server";

import {
  isAuthenticationError,
  isEmailAlreadyInUseError,
  isEmailNotVerifiedError,
  isInvalidCredentialsError,
  isWeakPasswordError,
  requestPasswordReset,
  revokeSession,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  verifySession,
} from "@eduatlas/application";
import { AppRole } from "@eduatlas/domain";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getNotificationService } from "../notifications/repository";
import { getAuthenticationService } from "./authentication-service";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  OWNER_SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from "./session-cookie";

export type AuthFormState = {
  ok: boolean;
  message: string;
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function safeNextPath(raw: string, fallback: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  return raw;
}

function homePathForRole(role: AppRole): string {
  if (role === AppRole.Admin) {
    return "/admin";
  }
  if (role === AppRole.Parent) {
    return "/veli";
  }
  return "/owner";
}

function resolvePostAuthPath(role: AppRole, requestedNext: string): string {
  const home = homePathForRole(role);
  const next = safeNextPath(requestedNext, home);

  if (role === AppRole.Parent && (next.startsWith("/owner") || next.startsWith("/admin"))) {
    return "/veli";
  }
  if (role === AppRole.Owner && (next.startsWith("/veli") || next.startsWith("/admin"))) {
    return "/owner";
  }
  // Admin always lands in the admin portal (Genel bakış), never owner/veli defaults from /login.
  if (role === AppRole.Admin) {
    return next.startsWith("/admin") ? next : "/admin";
  }
  return next;
}

async function setSessionCookie(sessionCookie: string, role: AppRole): Promise<void> {
  const jar = await cookies();
  const maxAge =
    role === AppRole.Admin ? ADMIN_SESSION_MAX_AGE_SECONDS : OWNER_SESSION_MAX_AGE_SECONDS;
  jar.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    path: "/",
    maxAge,
  });
}

async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    path: "/",
    maxAge: 0,
  });
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const portal = readString(formData, "portal") === "parent" ? "parent" : "owner";
  const fallbackNext =
    readString(formData, "next") || (portal === "parent" ? "/veli" : "/owner");

  try {
    const result = await signInWithEmailPassword(
      { email, password },
      { authenticationService: getAuthenticationService() },
    );
    const role = result.session.user.role;

    if (!result.session.user.emailVerified) {
      return {
        ok: false,
        message:
          "E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzdaki bağlantıya tıklayın, ardından tekrar giriş yapın.",
      };
    }

    if (portal === "parent" && role !== AppRole.Parent) {
      return {
        ok: false,
        message:
          "Bu hesap veli hesabı değil. Kurum veya yönetici girişi için Kurum Girişi sayfasını kullanın.",
      };
    }
    if (portal === "owner" && role === AppRole.Parent) {
      return {
        ok: false,
        message: "Bu bir veli hesabı. Devam etmek için Veli Girişi sayfasını kullanın.",
      };
    }

    await setSessionCookie(result.session.sessionCookie, role);
    redirect(resolvePostAuthPath(role, fallbackNext));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      ok: false,
      message: toAuthMessage(error, "Giriş yapılamadı. Bilgilerinizi kontrol edin."),
    };
  }
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const displayName = readString(formData, "displayName");
  const accountType = readString(formData, "accountType");
  const role = accountType === "parent" ? "parent" : "owner";
  const next = safeNextPath(readString(formData, "next"), role === "parent" ? "/veli" : "/owner");
  const loginPath = role === "parent" ? "/veli/giris" : "/login";

  try {
    const notificationService = await getNotificationService();
    await signUpWithEmailPassword(
      { email, password, displayName, role },
      {
        authenticationService: getAuthenticationService(),
        notificationService,
        siteBaseUrl: getSeoSiteConfig().siteUrl,
      },
    );
    redirect(`${loginPath}?notice=verify_email&next=${encodeURIComponent(next)}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      ok: false,
      message: toAuthMessage(error, "Kayıt tamamlanamadı."),
    };
  }
}

export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email");

  try {
    const notificationService = await getNotificationService();
    await requestPasswordReset(
      { email },
      {
        authenticationService: getAuthenticationService(),
        notificationService,
      },
    );
    return {
      ok: true,
      message:
        "Şifre sıfırlama bağlantısı gönderildiyse e-posta kutunuza düşecektir. Gelen kutusu ve spam klasörünü kontrol edin.",
    };
  } catch (error) {
    return {
      ok: false,
      message: toAuthMessage(error, "Şifre sıfırlama isteği gönderilemedi."),
    };
  }
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  let logoutRedirect = "/login?notice=logged_out";

  if (raw) {
    try {
      const session = await verifySession(decodeURIComponent(raw), {
        authenticationService: getAuthenticationService(),
      });
      if (session.user.role === AppRole.Parent) {
        logoutRedirect = "/veli/giris?notice=logged_out";
      }
      await revokeSession(decodeURIComponent(raw), {
        authenticationService: getAuthenticationService(),
      });
    } catch {
      // continue to clear cookie
    }
  }
  await clearSessionCookie();
  redirect(logoutRedirect);
}

function toAuthMessage(error: unknown, fallback: string): string {
  if (isInvalidCredentialsError(error)) {
    return "E-posta veya şifre hatalı. Bu e-posta ile kayıtlı bir hesap yoksa önce kayıt olun.";
  }
  if (isEmailNotVerifiedError(error)) {
    return "E-posta adresinizi doğrulamadan giriş yapamazsınız. Gelen kutunuzu kontrol edin.";
  }
  if (isEmailAlreadyInUseError(error)) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }
  if (isWeakPasswordError(error)) {
    return error.message;
  }
  if (isAuthenticationError(error)) {
    return error.message;
  }
  return fallback;
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}
