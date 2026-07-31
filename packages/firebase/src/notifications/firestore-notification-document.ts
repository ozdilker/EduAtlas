/**
 * Firestore document shape for `notifications` and `notification_preferences`.
 */
export type FirestoreNotificationDocument = {
  userId: string;
  type: string;
  status: string;
  channels: string[];
  title: string;
  body: string;
  href?: string;
  institutionId?: string;
  email?: string;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, string>;
};

export type FirestoreNotificationPreferenceDocument = {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  disabledTypes: string[];
  updatedAt: string;
};

export const NOTIFICATIONS_COLLECTION = "notifications";
export const NOTIFICATION_PREFERENCES_COLLECTION = "notification_preferences";
