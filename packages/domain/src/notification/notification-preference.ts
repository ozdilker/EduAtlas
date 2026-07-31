import { NotificationChannel, parseNotificationChannel } from "./notification-channel";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
  parseNotificationType,
} from "./notification-type";

/**
 * Per-user channel preferences. Defaults: both email and in-app enabled.
 */
export type NotificationPreference = Readonly<{
  readonly userId: string;
  readonly emailEnabled: boolean;
  readonly inAppEnabled: boolean;
  /** Disabled types (channel-agnostic opt-out). Empty = all types allowed. */
  readonly disabledTypes: readonly NotificationType[];
  readonly updatedAt: string;
}>;

export type CreateNotificationPreferenceInput = {
  userId: string;
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  disabledTypes?: readonly (NotificationType | string)[];
  updatedAt: string;
};

export function createNotificationPreference(
  input: CreateNotificationPreferenceInput,
): NotificationPreference {
  const userId = input.userId.trim();
  if (!userId) {
    throw new Error("NotificationPreference.userId is required.");
  }
  if (Number.isNaN(Date.parse(input.updatedAt))) {
    throw new Error("NotificationPreference.updatedAt must be a valid ISO timestamp.");
  }

  const disabledTypes = Object.freeze(
    (input.disabledTypes ?? []).map((type) =>
      typeof type === "string" ? parseNotificationType(type) : type,
    ),
  );

  return Object.freeze({
    userId,
    emailEnabled: input.emailEnabled ?? true,
    inAppEnabled: input.inAppEnabled ?? true,
    disabledTypes,
    updatedAt: input.updatedAt,
  });
}

export function defaultNotificationPreference(
  userId: string,
  updatedAt: string = new Date().toISOString(),
): NotificationPreference {
  return createNotificationPreference({ userId, updatedAt });
}

export function isChannelEnabled(
  preference: NotificationPreference,
  channel: NotificationChannel | string,
): boolean {
  const resolved = typeof channel === "string" ? parseNotificationChannel(channel) : channel;
  if (resolved === NotificationChannel.Email) {
    return preference.emailEnabled;
  }
  return preference.inAppEnabled;
}

export function isTypeEnabled(
  preference: NotificationPreference,
  type: NotificationType | string,
): boolean {
  const resolved = typeof type === "string" ? parseNotificationType(type) : type;
  return !preference.disabledTypes.includes(resolved);
}

export function allNotificationTypesEnabled(preference: NotificationPreference): boolean {
  return preference.disabledTypes.length === 0;
}

export { NOTIFICATION_TYPES };
