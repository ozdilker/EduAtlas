import type { ListNotificationsOptions, NotificationRepository } from "@eduatlas/application";
import {
  createNotification,
  createNotificationId,
  createNotificationPreference,
  type Notification,
  type NotificationId,
  type NotificationPreference,
  NotificationStatus,
  notificationIdAsString,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import {
  type FirestoreNotificationDocument,
  type FirestoreNotificationPreferenceDocument,
  NOTIFICATION_PREFERENCES_COLLECTION,
  NOTIFICATIONS_COLLECTION,
} from "./firestore-notification-document";

export type FirestoreNotificationRepositoryOptions = {
  firestore: Firestore;
};

/**
 * Firestore-backed NotificationRepository (Admin SDK, server-only).
 */
export class FirestoreNotificationRepository implements NotificationRepository {
  private readonly firestore: Firestore;

  constructor(options: FirestoreNotificationRepositoryOptions) {
    this.firestore = options.firestore;
  }

  async save(notification: Notification): Promise<Notification> {
    const id = notificationIdAsString(notification.id);
    await this.firestore
      .collection(NOTIFICATIONS_COLLECTION)
      .doc(id)
      .set(toFirestoreNotification(notification));
    return notification;
  }

  async getById(id: NotificationId | string): Promise<Notification | null> {
    const key =
      typeof id === "string" ? createNotificationId(id).value : notificationIdAsString(id);
    const snap = await this.firestore.collection(NOTIFICATIONS_COLLECTION).doc(key).get();
    if (!snap.exists) {
      return null;
    }
    return fromFirestoreNotification(key, snap.data() as FirestoreNotificationDocument);
  }

  async listForUser(options: ListNotificationsOptions): Promise<readonly Notification[]> {
    const userId = options.userId.trim();
    const limit = options.limit ?? 50;
    let query = this.firestore
      .collection(NOTIFICATIONS_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (options.status) {
      query = this.firestore
        .collection(NOTIFICATIONS_COLLECTION)
        .where("userId", "==", userId)
        .where("status", "==", options.status)
        .orderBy("createdAt", "desc")
        .limit(limit);
    }

    const snap = await query.get();
    return Object.freeze(
      snap.docs.map((doc) =>
        fromFirestoreNotification(doc.id, doc.data() as FirestoreNotificationDocument),
      ),
    );
  }

  async countUnread(userId: string): Promise<number> {
    const snap = await this.firestore
      .collection(NOTIFICATIONS_COLLECTION)
      .where("userId", "==", userId.trim())
      .where("status", "==", NotificationStatus.Unread)
      .get();
    return snap.size;
  }

  async getPreference(userId: string): Promise<NotificationPreference | null> {
    const snap = await this.firestore
      .collection(NOTIFICATION_PREFERENCES_COLLECTION)
      .doc(userId.trim())
      .get();
    if (!snap.exists) {
      return null;
    }
    return fromFirestorePreference(snap.data() as FirestoreNotificationPreferenceDocument);
  }

  async savePreference(preference: NotificationPreference): Promise<NotificationPreference> {
    await this.firestore
      .collection(NOTIFICATION_PREFERENCES_COLLECTION)
      .doc(preference.userId)
      .set(toFirestorePreference(preference));
    return preference;
  }
}

export function createFirestoreNotificationRepository(
  firestore: Firestore,
): FirestoreNotificationRepository {
  return new FirestoreNotificationRepository({ firestore });
}

function toFirestoreNotification(notification: Notification): FirestoreNotificationDocument {
  const document: FirestoreNotificationDocument = {
    userId: notification.userId,
    type: notification.type,
    status: notification.status,
    channels: [...notification.channels],
    title: notification.title,
    body: notification.body,
    createdAt: notification.createdAt,
  };
  if (notification.href) document.href = notification.href;
  if (notification.institutionId) document.institutionId = notification.institutionId;
  if (notification.email) document.email = notification.email;
  if (notification.readAt) document.readAt = notification.readAt;
  if (notification.metadata) document.metadata = { ...notification.metadata };
  return document;
}

function fromFirestoreNotification(id: string, data: FirestoreNotificationDocument): Notification {
  return createNotification({
    id,
    userId: data.userId,
    type: data.type,
    status: data.status,
    channels: data.channels,
    title: data.title,
    body: data.body,
    href: data.href,
    institutionId: data.institutionId,
    email: data.email,
    createdAt: data.createdAt,
    readAt: data.readAt,
    metadata: data.metadata,
  });
}

function toFirestorePreference(
  preference: NotificationPreference,
): FirestoreNotificationPreferenceDocument {
  return {
    userId: preference.userId,
    emailEnabled: preference.emailEnabled,
    inAppEnabled: preference.inAppEnabled,
    disabledTypes: [...preference.disabledTypes],
    updatedAt: preference.updatedAt,
  };
}

function fromFirestorePreference(
  data: FirestoreNotificationPreferenceDocument,
): NotificationPreference {
  return createNotificationPreference({
    userId: data.userId,
    emailEnabled: data.emailEnabled,
    inAppEnabled: data.inAppEnabled,
    disabledTypes: data.disabledTypes,
    updatedAt: data.updatedAt,
  });
}
