export type OwnerNotificationItemView = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  status: string;
  unread: boolean;
  createdAt: string;
  createdAtLabel: string;
};

export type OwnerNotificationTypeSettingView = {
  id: string;
  label: string;
  enabled: boolean;
};

export type OwnerNotificationSettingsView = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  types: readonly OwnerNotificationTypeSettingView[];
};

export type OwnerNotificationsPageViewData = {
  unreadCount: number;
  notifications: readonly OwnerNotificationItemView[];
  settings: OwnerNotificationSettingsView;
};

export type OwnerNotificationSettingsFormState = {
  ok: boolean;
  message: string;
};
