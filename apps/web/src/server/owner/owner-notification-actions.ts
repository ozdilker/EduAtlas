"use server";

import { NotificationType, parseNotificationType } from "@eduatlas/domain";
import { revalidatePath } from "next/cache";
import { requireOwnerSession } from "../auth/current-session";
import { getNotificationService } from "../notifications/repository";

export type NotificationSettingsFormState = {
  ok: boolean;
  message: string;
};

/**
 * Mark a single notification as read for the authenticated owner.
 */
export async function markOwnerNotificationReadAction(formData: FormData): Promise<void> {
  const session = await requireOwnerSession();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  if (!notificationId) {
    return;
  }

  const service = await getNotificationService();
  await service.markAsRead(session.user.uid, notificationId);
  revalidatePath("/owner/notifications");
  revalidatePath("/owner");
}

export async function markAllOwnerNotificationsReadAction(): Promise<void> {
  const session = await requireOwnerSession();
  const service = await getNotificationService();
  await service.markAllAsRead(session.user.uid);
  revalidatePath("/owner/notifications");
  revalidatePath("/owner");
}

export async function updateOwnerNotificationSettingsAction(
  _prev: NotificationSettingsFormState,
  formData: FormData,
): Promise<NotificationSettingsFormState> {
  const session = await requireOwnerSession();
  const emailEnabled = formData.get("emailEnabled") === "on";
  const inAppEnabled = formData.get("inAppEnabled") === "on";

  const disabledTypes: NotificationType[] = [];
  for (const type of Object.values(NotificationType)) {
    if (formData.get(`type_${type}`) !== "on") {
      disabledTypes.push(parseNotificationType(type));
    }
  }

  try {
    const service = await getNotificationService();
    await service.updatePreferences({
      userId: session.user.uid,
      emailEnabled,
      inAppEnabled,
      disabledTypes,
    });
    revalidatePath("/owner/settings");
    revalidatePath("/owner/notifications");
    return { ok: true, message: "Bildirim tercihleri kaydedildi." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Tercihler kaydedilemedi.",
    };
  }
}
