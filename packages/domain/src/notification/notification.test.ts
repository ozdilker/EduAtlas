import { describe, expect, it } from "vitest";
import {
  createNotification,
  createNotificationPreference,
  defaultNotificationPreference,
  isChannelEnabled,
  isTypeEnabled,
  markNotificationRead,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from "./index";

describe("notification domain", () => {
  it("creates an unread notification", () => {
    const notification = createNotification({
      id: "notif_1",
      userId: "user_1",
      type: NotificationType.LeadReceived,
      channels: [NotificationChannel.InApp, NotificationChannel.Email],
      title: "Yeni talep",
      body: "Kurumunuza yeni bir bilgi talebi geldi.",
      institutionId: "inst_1",
      createdAt: "2026-07-15T10:00:00.000Z",
    });

    expect(notification.status).toBe(NotificationStatus.Unread);
    expect(notification.channels).toContain(NotificationChannel.Email);
  });

  it("marks notification as read", () => {
    const unread = createNotification({
      id: "notif_2",
      userId: "user_1",
      type: NotificationType.Welcome,
      channels: [NotificationChannel.InApp],
      title: "Hoş geldiniz",
      body: "EduAtlas hesabınız hazır.",
      createdAt: "2026-07-15T10:00:00.000Z",
    });

    const read = markNotificationRead(unread, "2026-07-15T11:00:00.000Z");
    expect(read.status).toBe(NotificationStatus.Read);
    expect(read.readAt).toBe("2026-07-15T11:00:00.000Z");
  });

  it("applies preference channel and type gates", () => {
    const preference = createNotificationPreference({
      userId: "user_1",
      emailEnabled: false,
      inAppEnabled: true,
      disabledTypes: [NotificationType.ProfileUpdated],
      updatedAt: "2026-07-15T10:00:00.000Z",
    });

    expect(isChannelEnabled(preference, NotificationChannel.Email)).toBe(false);
    expect(isChannelEnabled(preference, NotificationChannel.InApp)).toBe(true);
    expect(isTypeEnabled(preference, NotificationType.LeadReceived)).toBe(true);
    expect(isTypeEnabled(preference, NotificationType.ProfileUpdated)).toBe(false);
    expect(defaultNotificationPreference("user_1").emailEnabled).toBe(true);
  });
});
