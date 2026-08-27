import type { ReactNode } from "react";
import { ContentPageView } from "../layout/content-page-view";
import { cn } from "../lib/cn";

export type AuthPageNotice =
  | "session_expired"
  | "unauthenticated"
  | "email_unverified"
  | "email_verified"
  | "forbidden"
  | "logged_out"
  | "verify_email"
  | "";

export type AuthPageProps = {
  title: string;
  description: string;
  notice?: AuthPageNotice | string;
  children: ReactNode;
  className?: string;
};

const NOTICE_COPY: Record<string, string> = {
  session_expired: "Oturumunuzun süresi doldu. Devam etmek için yeniden giriş yapın.",
  unauthenticated: "Bu sayfaya erişmek için giriş yapmanız gerekir.",
  email_unverified: "Devam etmeden önce e-posta adresinizi doğrulayın.",
  email_verified: "E-posta adresiniz doğrulandı. Giriş yapabilirsiniz.",
  forbidden: "Bu alana erişim yetkiniz yok.",
  logged_out: "Güvenli bir şekilde çıkış yaptınız.",
  verify_email:
    "Hesabınız oluşturuldu. E-posta kutunuza gelen doğrulama bağlantısına tıklayın, ardından giriş yapın.",
};

/**
 * Shared auth page chrome for login / forgot / register.
 */
export function AuthPage({ title, description, notice = "", children, className }: AuthPageProps) {
  const noticeText = notice ? (NOTICE_COPY[notice] ?? "") : "";

  return (
    <ContentPageView
      title={title}
      description={description}
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "current", label: title },
      ]}
      nextSteps={[
        { id: "home", label: "Ana sayfaya dön", href: "/" },
        { id: "search", label: "Kurum ara", href: "/search" },
      ]}
      className={cn("ea-auth-page", className)}
    >
      {noticeText ? (
        <p
          className={cn(
            "ea-auth-page__notice",
            notice === "session_expired" || notice === "forbidden" || notice === "email_unverified"
              ? "ea-auth-page__notice--warning"
              : "ea-auth-page__notice--info",
          )}
          role="status"
        >
          {noticeText}
        </p>
      ) : null}
      {children}
    </ContentPageView>
  );
}
