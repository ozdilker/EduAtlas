import { AuthPage, RegisterForm } from "@eduatlas/ui";
import type { Metadata } from "next";
import { registerAction } from "@/server/auth/auth-actions";
import { redirectIfAuthenticated } from "@/server/auth/redirect-if-authenticated";

export const metadata: Metadata = {
  title: "Veli hesabı oluştur",
  robots: { index: false, follow: false },
};

/**
 * Parent registration — creates a parent-role account.
 */
export default async function ParentRegisterPage() {
  await redirectIfAuthenticated({ preferredNext: "/veli" });

  return (
    <AuthPage
      title="Veli hesabı oluştur"
      description="Favorilerinizi kaydetmek ve kurumları kıyaslamak için ücretsiz veli hesabı açın."
    >
      <RegisterForm action={registerAction} nextPath="/veli" accountType="parent" />
      <p className="ea-auth-form__hint">
        Kurum kaydı için <a href="/register">kurum hesabı oluşturun</a>.
      </p>
    </AuthPage>
  );
}
