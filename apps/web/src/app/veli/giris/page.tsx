import { AuthPage, LoginForm } from "@eduatlas/ui";
import type { Metadata } from "next";
import { loginAction } from "@/server/auth/auth-actions";
import { redirectIfAuthenticated } from "@/server/auth/redirect-if-authenticated";

export const metadata: Metadata = {
  title: "Veli girişi",
  robots: { index: false, follow: false },
};

type ParentLoginPageProps = {
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
 * Parent login — redirects to /veli after successful auth.
 */
export default async function ParentLoginPage({ searchParams }: ParentLoginPageProps) {
  const params = await searchParams;
  const nextPath = first(params.next) || "/veli";
  const notice = first(params.notice) || first(params.reason);

  await redirectIfAuthenticated({
    preferredNext: nextPath.startsWith("/") ? nextPath : "/veli",
  });

  return (
    <AuthPage
      title="Veli girişi"
      description="Favori kurumlarınızı görmek ve kıyaslamak için hesabınıza giriş yapın."
      notice={notice}
    >
      <LoginForm
        action={loginAction}
        nextPath={nextPath.startsWith("/") ? nextPath : "/veli"}
        portal="parent"
      />
      <p className="ea-auth-form__hint">
        Hesabınız yok mu? <a href="/veli/kayit">Kayıt olun</a>
      </p>
      <p className="ea-auth-form__hint">
        Kurum sahibi misiniz? <a href="/login">Kurum girişi</a>
      </p>
    </AuthPage>
  );
}
