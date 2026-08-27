import { AuthPage, LoginForm } from "@eduatlas/ui";
import type { Metadata } from "next";
import { loginAction } from "@/server/auth/auth-actions";
import { redirectIfAuthenticated } from "@/server/auth/redirect-if-authenticated";

export const metadata: Metadata = {
  title: "Kurum Girişi",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    reason?: string | string[];
    notice?: string | string[];
  }>;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Owner/Admin login — Firebase Auth via server actions only.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = first(params.next) || "/owner";
  const notice = first(params.notice) || first(params.reason);

  await redirectIfAuthenticated({
    preferredNext: nextPath.startsWith("/") ? nextPath : "/owner",
  });

  return (
    <AuthPage
      title="Kurum Girişi"
      description="Kurum sahibi veya yönetici hesabınızla giriş yapın."
      notice={notice}
    >
      <LoginForm
        action={loginAction}
        nextPath={nextPath.startsWith("/") ? nextPath : "/owner"}
        portal="owner"
      />
      <p className="ea-auth-form__hint">
        Hesabınız yok mu? <a href="/register">Kayıt olun</a>
      </p>
      <p className="ea-auth-form__hint">
        Veli misiniz? <a href="/veli/giris">Veli girişi</a>
      </p>
    </AuthPage>
  );
}
