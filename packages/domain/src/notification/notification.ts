import { type NotificationChannel, parseNotificationChannel } from "./notification-channel";
import {
  type NotificationStatus,
  NotificationStatus as NotificationStatusEnum,
  parseNotificationStatus,
} from "./notification-status";
import { type NotificationType, parseNotificationType } from "./notification-type";

/**
 * Opaque notification identity.
 */
export type NotificationId = Readonly<{
  readonly value: string;
}>;

const NOTIFICATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function createNotificationId(raw: string): NotificationId {
  const value = raw.trim();
  if (!NOTIFICATION_ID_PATTERN.test(value)) {
    throw new Error("NotificationId must be 1–128 URL-safe characters.");
  }
  return Object.freeze({ value });
}

export function notificationIdAsString(id: NotificationId): string {
  return id.value;
}

/**
 * Canonical notification aggregate — one event, optional multi-channel delivery.
 */
export type Notification = Readonly<{
  readonly id: NotificationId;
  /** Recipient Auth uid. Required for in-app inbox. */
  readonly userId: string;
  readonly type: NotificationType;
  readonly status: NotificationStatus;
  readonly channels: readonly NotificationChannel[];
  readonly title: string;
  readonly body: string;
  readonly href?: string;
  readonly institutionId?: string;
  readonly email?: string;
  readonly createdAt: string;
  readonly readAt?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}>;

export type CreateNotificationInput = {
  id: string;
  userId: string;
  type: NotificationType | string;
  status?: NotificationStatus | string;
  channels: readonly (NotificationChannel | string)[];
  title: string;
  body: string;
  href?: string;
  institutionId?: string;
  email?: string;
  createdAt: string;
  readAt?: string;
  metadata?: Readonly<Record<string, string>>;
};

export function createNotification(input: CreateNotificationInput): Notification {
  const userId = input.userId.trim();
  const title = input.title.trim();
  const body = input.body.trim();
  const href = input.href?.trim();
  const institutionId = input.institutionId?.trim();
  const email = input.email?.trim().toLowerCase();
  const type = typeof input.type === "string" ? parseNotificationType(input.type) : input.type;
  const status =
    input.status === undefined
      ? NotificationStatusEnum.Unread
      : typeof input.status === "string"
        ? parseNotificationStatus(input.status)
        : input.status;

  if (!userId) {
    throw new Error("Notification.userId is required.");
  }
  if (!title || title.length > 200) {
    throw new Error("Notification.title must be 1–200 characters.");
  }
  if (!body || body.length > 4000) {
    throw new Error("Notification.body must be 1–4000 characters.");
  }
  if (input.channels.length === 0) {
    throw new Error("Notification.channels must include at least one channel.");
  }

  const channels = Object.freeze(
    input.channels.map((channel) =>
      typeof channel === "string" ? parseNotificationChannel(channel) : channel,
    ),
  );

  assertIsoTimestamp(input.createdAt, "createdAt");
  if (input.readAt !== undefined) {
    assertIsoTimestamp(input.readAt, "readAt");
  }

  return Object.freeze({
    id: createNotificationId(input.id),
    userId,
    type,
    status,
    channels,
    title,
    body,
    ...(href ? { href } : {}),
    ...(institutionId ? { institutionId } : {}),
    ...(email ? { email } : {}),
    createdAt: input.createdAt,
    ...(input.readAt ? { readAt: input.readAt } : {}),
    ...(input.metadata ? { metadata: Object.freeze({ ...input.metadata }) } : {}),
  });
}

export function markNotificationRead(
  notification: Notification,
  readAt: string = new Date().toISOString(),
): Notification {
  if (notification.status === NotificationStatusEnum.Read) {
    return notification;
  }
  assertIsoTimestamp(readAt, "readAt");
  return createNotification({
    id: notification.id.value,
    userId: notification.userId,
    type: notification.type,
    status: NotificationStatusEnum.Read,
    channels: notification.channels,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    institutionId: notification.institutionId,
    email: notification.email,
    createdAt: notification.createdAt,
    readAt,
    metadata: notification.metadata,
  });
}

function assertIsoTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`Notification.${field} must be a valid ISO timestamp.`);
  }
}
