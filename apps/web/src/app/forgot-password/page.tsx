import { AuthPage, ForgotPasswordForm } from "@eduatlas/ui";
import type { Metadata } from "next";
import { forgotPasswordAction } from "@/server/auth/auth-actions";

export const metadata: Metadata = {
  title: "Şifre sıfırlama",
  robots: { index: false, follow: false },
};

/**
 * Password reset request — server action → AuthenticationService.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthPage
      title="Şifre sıfırlama"
      description="Hesabınıza kayıtlı e-posta adresini girin. Varsa sıfırlama bağlantısı gönderilir."
    >
      <ForgotPasswordForm action={forgotPasswordAction} />
    </AuthPage>
  );
}
