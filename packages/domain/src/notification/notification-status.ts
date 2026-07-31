/**
 * In-app notification read lifecycle.
 */
export enum NotificationStatus {
  Unread = "unread",
  Read = "read",
  Archived = "archived",
}

export const NOTIFICATION_STATUSES: readonly NotificationStatus[] = Object.freeze([
  NotificationStatus.Unread,
  NotificationStatus.Read,
  NotificationStatus.Archived,
]);

const STATUS_SET = new Set<string>(NOTIFICATION_STATUSES);

export function isNotificationStatus(value: string): value is NotificationStatus {
  return STATUS_SET.has(value);
}

export function parseNotificationStatus(value: string): NotificationStatus {
  if (!isNotificationStatus(value)) {
    throw new Error(`Unknown NotificationStatus: ${value}`);
  }
  return value;
}

export function isUnreadNotificationStatus(status: NotificationStatus): boolean {
  return status === NotificationStatus.Unread;
}
