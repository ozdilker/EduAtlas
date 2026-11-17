"use server";

import {
  isSeoActionTaskValidationError,
  isUnauthorizedError,
  updateSeoActionTask,
} from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/server/auth/current-session";
import { getSeoActionTaskRepository } from "../seo/seo-action-task-repository";
import { isSeoActionTaskAdminUid } from "./seo-action-task-admin-lookup";

function withNotice(message: string): never {
  const params = new URLSearchParams();
  params.set("notice", message);
  redirect(`/admin/seo?${params.toString()}`);
}

/**
 * Admin: upsert SEO action task status / assignee / note.
 * updatedAt/updatedBy are server-authoritative.
 */
export async function updateSeoActionTaskAction(formData: FormData): Promise<void> {
  try {
    const session = await requireAdminSession();
    const fingerprint = String(formData.get("fingerprint") ?? "").trim();
    const sourceKey = String(formData.get("sourceKey") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const assigneeUid = String(formData.get("assigneeUid") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();

    const seoActionTaskRepository = await getSeoActionTaskRepository();
    await updateSeoActionTask(
      {
        fingerprint,
        sourceKey,
        status,
        assigneeUid: assigneeUid || null,
        note: note || null,
        updatedBy: session.user.uid,
      },
      {
        seoActionTaskRepository,
        isAdminUid: isSeoActionTaskAdminUid,
      },
    );

    revalidatePath("/admin/seo");
    withNotice("SEO görevi güncellendi.");
  } catch (error) {
    if (isUnauthorizedError(error)) {
      withNotice("Yönetim paneli için yetkiniz yok.");
    }
    if (isSeoActionTaskValidationError(error)) {
      withNotice(error.message);
    }
    withNotice(error instanceof Error ? error.message : "Görev güncellemesi başarısız.");
  }
}
