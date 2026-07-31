/**
 * Delivery channels for a notification event.
 */
export enum NotificationChannel {
  InApp = "in_app",
  Email = "email",
}

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = Object.freeze([
  NotificationChannel.InApp,
  NotificationChannel.Email,
]);

const CHANNEL_SET = new Set<string>(NOTIFICATION_CHANNELS);

export function isNotificationChannel(value: string): value is NotificationChannel {
  return CHANNEL_SET.has(value);
}

export function parseNotificationChannel(value: string): NotificationChannel {
  if (!isNotificationChannel(value)) {
    throw new Error(`Unknown NotificationChannel: ${value}`);
  }
  return value;
}
