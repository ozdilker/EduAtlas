import { NOTIFICATION_TYPES, NotificationStatus } from "@eduatlas/domain";
import type {
  OwnerNotificationItemView,
  OwnerNotificationSettingsView,
  OwnerNotificationsPageViewData,
} from "@eduatlas/ui";
import { requireOwnerSession } from "../auth/current-session";
import { getNotificationService } from "../notifications/repository";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Loads Notification Center + settings view for the authenticated owner.
 */
export async function getOwnerNotificationsView(): Promise<OwnerNotificationsPageViewData> {
  const session = await requireOwnerSession();
  const service = await getNotificationService();
  const [items, unreadCount, preferences] = await Promise.all([
    service.listForUser(session.user.uid, { limit: 50 }),
    service.countUnread(session.user.uid),
    service.getPreferences(session.user.uid),
  ]);

  const notifications: OwnerNotificationItemView[] = items.map((item) =>
    Object.freeze({
      id: item.id.value,
      type: item.type,
      title: item.title,
      body: item.body,
      href: item.href ?? "",
      status: item.status,
      unread: item.status === NotificationStatus.Unread,
      createdAt: item.createdAt,
      createdAtLabel: formatWhen(item.createdAt),
    }),
  );

  const disabled = new Set(preferences.disabledTypes);
  const settings: OwnerNotificationSettingsView = Object.freeze({
    emailEnabled: preferences.emailEnabled,
    inAppEnabled: preferences.inAppEnabled,
    types: NOTIFICATION_TYPES.map((type) =>
      Object.freeze({
        id: type,
        label: notificationTypeLabel(type),
        enabled: !disabled.has(type),
      }),
    ),
  });

  return Object.freeze({
    unreadCount,
    notifications: Object.freeze(notifications),
    settings,
  });
}

function notificationTypeLabel(type: string): string {
  switch (type) {
    case "lead_received":
      return "Yeni talepler";
    case "claim_submitted":
      return "Sahiplenme gönderildi";
    case "claim_approved":
      return "Sahiplenme onayı";
    case "profile_updated":
      return "Profil güncellemeleri";
    case "password_reset":
      return "Şifre sıfırlama";
    case "welcome":
      return "Hoş geldiniz";
    case "email_verification":
      return "E-posta doğrulama";
    default:
      return type;
  }
}
