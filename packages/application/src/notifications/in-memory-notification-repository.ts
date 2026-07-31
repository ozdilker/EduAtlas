import {
  createNotificationId,
  type Notification,
  type NotificationId,
  type NotificationPreference,
  NotificationStatus,
  notificationIdAsString,
} from "@eduatlas/domain";
import type { ListNotificationsOptions, NotificationRepository } from "./notification-repository";

/**
 * In-memory NotificationRepository for tests and local development.
 */
export class InMemoryNotificationRepository implements NotificationRepository {
  private readonly notifications = new Map<string, Notification>();
  private readonly preferences = new Map<string, NotificationPreference>();

  async save(notification: Notification): Promise<Notification> {
    this.notifications.set(notification.id.value, notification);
    return notification;
  }

  async getById(id: NotificationId | string): Promise<Notification | null> {
    const key =
      typeof id === "string" ? createNotificationId(id).value : notificationIdAsString(id);
    return this.notifications.get(key) ?? null;
  }

  async listForUser(options: ListNotificationsOptions): Promise<readonly Notification[]> {
    const userId = options.userId.trim();
    const limit = options.limit ?? 50;
    const items = [...this.notifications.values()]
      .filter((item) => item.userId === userId)
      .filter((item) => (options.status ? item.status === options.status : true))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
    return Object.freeze(items);
  }

  async countUnread(userId: string): Promise<number> {
    const key = userId.trim();
    return [...this.notifications.values()].filter(
      (item) => item.userId === key && item.status === NotificationStatus.Unread,
    ).length;
  }

  async getPreference(userId: string): Promise<NotificationPreference | null> {
    return this.preferences.get(userId.trim()) ?? null;
  }

  async savePreference(preference: NotificationPreference): Promise<NotificationPreference> {
    this.preferences.set(preference.userId, preference);
    return preference;
  }
}

export function createInMemoryNotificationRepository(): InMemoryNotificationRepository {
  return new InMemoryNotificationRepository();
}
