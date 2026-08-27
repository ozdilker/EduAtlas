import { NotificationType } from "@eduatlas/domain";

export type NotificationCopy = Readonly<{
  readonly title: string;
  readonly body: string;
  readonly href?: string;
  /** Optional email subject override (defaults to type subject map). */
  readonly subject?: string;
  /** Optional CTA label when href is present. */
  readonly ctaLabel?: string;
}>;

export type NotificationAccountRole = "parent" | "owner";

export type NotificationEventPayload = {
  type: NotificationType;
  institutionId?: string;
  institutionName?: string;
  leadId?: string;
  claimRequestId?: string;
  actorEmail?: string;
  /** Account role for welcome / verification copy. Defaults to owner. */
  accountRole?: NotificationAccountRole;
  /** Absolute Firebase email-verification link (parent branded mail). */
  verificationLink?: string;
};

/**
 * Turkish copy for transactional notification events.
 */
export function buildNotificationCopy(payload: NotificationEventPayload): NotificationCopy {
  switch (payload.type) {
    case NotificationType.LeadReceived: {
      const name = payload.institutionName?.trim() || "Kurumunuz";
      return Object.freeze({
        title: "Yeni bilgi talebi",
        body: `${name} için yeni bir ebeveyn talebi alındı.`,
        href: payload.leadId ? `/owner/leads/${payload.leadId}` : "/owner?tab=leads",
      });
    }
    case NotificationType.ClaimSubmitted:
      return Object.freeze({
        title: "Sahiplenme talebi alındı",
        body: "Kurum sahiplenme talebiniz alındı. İnceleme sonrasında bilgilendirileceksiniz.",
        href: "/owner/onboarding",
      });
    case NotificationType.ClaimApproved: {
      const name = payload.institutionName?.trim() || "Kurum";
      return Object.freeze({
        title: "Sahiplenme onaylandı",
        body: `${name} sahipliği onaylandı. Kurum panelinizi kullanmaya başlayabilirsiniz.`,
        href: "/owner",
      });
    }
    case NotificationType.ProfileUpdated: {
      const name = payload.institutionName?.trim() || "Kurum profiliniz";
      return Object.freeze({
        title: "Profil güncellendi",
        body: `${name} yayınlanan alanları güncellendi.`,
        href: "/owner/profile",
      });
    }
    case NotificationType.PasswordReset:
      return Object.freeze({
        title: "Şifre sıfırlama isteği",
        body: "Hesabınız için bir şifre sıfırlama isteği oluşturuldu. E-posta kutunuzu kontrol edin.",
        href: "/login",
      });
    case NotificationType.Welcome:
      if (payload.accountRole === "parent") {
        return Object.freeze({
          title: "EduAtlas’a hoş geldiniz",
          subject: "EduAtlas — Veli hesabınız oluşturuldu",
          body: "Veli hesabınız oluşturuldu. E-posta adresinizi doğruladıktan sonra favori kurumlarınızı kaydedebilir ve kıyaslayabilirsiniz.",
          href: "/veli/giris",
          ctaLabel: "Veli girişine git",
        });
      }
      return Object.freeze({
        title: "EduAtlas’a hoş geldiniz",
        subject: "EduAtlas — Kurum hesabınız oluşturuldu",
        body: "Hesabınız oluşturuldu. E-posta doğrulaması ve sahiplik onayı sonrası kurum paneli açılır.",
        href: "/owner/onboarding",
        ctaLabel: "Kurum paneline git",
      });
    case NotificationType.EmailVerification: {
      const hasVerificationLink = Boolean(payload.verificationLink?.trim());
      if (payload.accountRole === "parent") {
        return Object.freeze({
          title: "Veli hesabı e-posta doğrulama",
          subject: "EduAtlas — Veli hesabınızı doğrulayın",
          body: hasVerificationLink
            ? "Veli hesabınızı tamamlamak için e-posta adresinizi doğrulayın. Aşağıdaki düğmeye tıklayın; ardından giriş yapabilirsiniz."
            : "Veli hesabınızı tamamlamak için e-posta adresinizi doğrulayın. Gelen kutunuzdaki doğrulama bağlantısını kullanın, ardından giriş yapın.",
          // In-app stays on portal; SMTP CTA uses verificationLink when present.
          href: "/veli/giris",
          ctaLabel: hasVerificationLink ? "E-postamı doğrula" : "Veli girişine git",
        });
      }
      return Object.freeze({
        title: "E-posta doğrulama",
        subject: "EduAtlas — Kurum hesabı e-posta doğrulama",
        body: "Devam etmek için e-posta adresinizi doğrulayın. Gelen kutunuza gönderilen bağlantıyı kullanın.",
        href: "/login",
        ctaLabel: "Kurum girişine git",
      });
    }
    default: {
      const exhaustive: never = payload.type;
      throw new Error(`Unsupported notification type: ${String(exhaustive)}`);
    }
  }
}
