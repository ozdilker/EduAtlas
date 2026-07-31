import { NotificationType } from "@eduatlas/domain";

export type NotificationCopy = Readonly<{
  readonly title: string;
  readonly body: string;
  readonly href?: string;
}>;

export type NotificationEventPayload = {
  type: NotificationType;
  institutionId?: string;
  institutionName?: string;
  leadId?: string;
  claimRequestId?: string;
  actorEmail?: string;
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
      return Object.freeze({
        title: "EduAtlas’a hoş geldiniz",
        body: "Hesabınız oluşturuldu. E-posta doğrulaması ve sahiplik onayı sonrası kurum paneli açılır.",
        href: "/owner/onboarding",
      });
    case NotificationType.EmailVerification:
      return Object.freeze({
        title: "E-posta doğrulama",
        body: "Devam etmek için e-posta adresinizi doğrulayın. Gelen kutunuza gönderilen bağlantıyı kullanın.",
        href: "/login",
      });
    default: {
      const exhaustive: never = payload.type;
      throw new Error(`Unsupported notification type: ${String(exhaustive)}`);
    }
  }
}
