import type {
  Notification,
  NotificationId,
  NotificationPreference,
  NotificationStatus,
} from "@eduatlas/domain";

export type ListNotificationsOptions = {
  userId: string;
  status?: NotificationStatus;
  limit?: number;
};

/**
 * Persistence port for notifications and preferences.
 */
export interface NotificationRepository {
  save(notification: Notification): Promise<Notification>;
  getById(id: NotificationId | string): Promise<Notification | null>;
  listForUser(options: ListNotificationsOptions): Promise<readonly Notification[]>;
  countUnread(userId: string): Promise<number>;
  getPreference(userId: string): Promise<NotificationPreference | null>;
  savePreference(preference: NotificationPreference): Promise<NotificationPreference>;
}
