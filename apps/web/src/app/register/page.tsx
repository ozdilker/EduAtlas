import { AuthPage, RegisterForm } from "@eduatlas/ui";
import type { Metadata } from "next";
import { registerAction } from "@/server/auth/auth-actions";

export const metadata: Metadata = {
  title: "Kurum hesabı oluştur",
  robots: { index: false, follow: false },
};

/**
 * Email/password registration with verification email (server-side).
 */
export default function RegisterPage() {
  return (
    <AuthPage
      title="Kurum hesabı oluştur"
      description="E-posta ve şifre ile hesap oluşturun. Panel erişimi e-posta doğrulaması ve onaylı sahiplik sonrası açılır."
    >
      <RegisterForm action={registerAction} />
    </AuthPage>
  );
}
