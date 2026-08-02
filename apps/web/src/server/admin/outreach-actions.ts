"use server";

import {
  CLAIM_INVITATION_DEFAULT_PREHEADER,
  CLAIM_INVITATION_DEFAULT_SUBJECT,
  CLAIM_INVITATION_TEMPLATE_ID,
  ISTANBUL_UNCLAIMED_SEGMENT_ID,
  isOutreachValidationError,
} from "@eduatlas/application";
import { campaignIdAsString } from "@eduatlas/domain";
import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { requireAdminSession } from "@/server/auth/current-session";
import { getEmailService } from "@/server/notifications/repository";
import { getOutreachService, tickOutreachDelivery } from "@/server/outreach/store";

function formString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function outreachRedirect(params: {
  id?: string;
  notice?: string;
  error?: string;
}): never {
  const q = new URLSearchParams();
  if (params.id) q.set("id", params.id);
  if (params.notice) q.set("notice", params.notice);
  if (params.error) q.set("error", params.error);
  const qs = q.toString();
  redirect(qs ? `/admin/outreach?${qs}` : "/admin/outreach");
}

export async function saveOutreachCampaignAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const service = await getOutreachService();
  const now = new Date().toISOString();

  const campaignId = formString(formData, "campaignId");
  const name = formString(formData, "name");
  const description = formString(formData, "description");
  const templateId = formString(formData, "templateId") || CLAIM_INVITATION_TEMPLATE_ID;
  const segmentId = formString(formData, "segmentId") || ISTANBUL_UNCLAIMED_SEGMENT_ID;
  const subjectOverride =
    formString(formData, "subjectOverride") || CLAIM_INVITATION_DEFAULT_SUBJECT;
  const preheader =
    formString(formData, "preheader") || CLAIM_INVITATION_DEFAULT_PREHEADER;

  try {
    if (campaignId) {
      const updated = await service.updateCampaign({
        campaignId,
        name,
        description: description || undefined,
        templateId,
        segmentId,
        subjectOverride,
        preheader,
        now,
      });
      outreachRedirect({
        id: campaignIdAsString(updated.id),
        notice: "Kampanya kaydedildi.",
      });
    }

    const created = await service.createCampaign({
      id: `camp_${randomBytes(6).toString("hex")}`,
      name: name || "Yeni kampanya",
      description: description || undefined,
      templateId,
      segmentId,
      subjectOverride,
      preheader,
      createdAt: now,
      createdBy: session.user.uid,
    });
    outreachRedirect({
      id: campaignIdAsString(created.id),
      notice: "Kampanya oluşturuldu.",
    });
  } catch (error) {
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Kampanya kaydedilemedi.";
    outreachRedirect({ id: campaignId || undefined, error: message });
  }
}

export async function sendOutreachTestEmailAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const service = await getOutreachService();
  const emailService = await getEmailService();
  const site = getSeoSiteConfig();
  const ctaHref = `${site.siteUrl.replace(/\/+$/, "")}/login`;
  const now = new Date().toISOString();

  const campaignId = formString(formData, "campaignId");
  const to = formString(formData, "to");
  const institutionName =
    formString(formData, "institutionName") || "Örnek Anaokulu";

  if (!campaignId) {
    outreachRedirect({ error: "Önce bir kampanya kaydedin." });
  }

  try {
    await service.sendTestEmail({
      campaignId,
      to,
      institutionName,
      ctaHref,
      now,
      emailService,
    });
    outreachRedirect({
      id: campaignId,
      notice: `Test e-postası gönderildi: ${to}`,
    });
  } catch (error) {
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Test e-postası gönderilemedi.";
    outreachRedirect({ id: campaignId, error: message });
  }
}

async function campaignAction(
  formData: FormData,
  run: (campaignId: string, now: string) => Promise<{ id: string; notice: string }>,
): Promise<void> {
  await requireAdminSession();
  const campaignId = formString(formData, "campaignId");
  if (!campaignId) {
    outreachRedirect({ error: "Kampanya seçilmedi." });
  }
  const now = new Date().toISOString();
  try {
    const result = await run(campaignId, now);
    outreachRedirect({ id: result.id, notice: result.notice });
  } catch (error) {
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "İşlem başarısız.";
    outreachRedirect({ id: campaignId, error: message });
  }
}

export async function prepareOutreachCampaignAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    const result = await service.prepareCampaign(campaignId, now);
    return {
      id: campaignId,
      notice: `Prepare tamam: ${result.recipientCount} alıcı (${result.skippedDuplicates} atlandı).`,
    };
  });
}

export async function approveOutreachCampaignAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    await service.approveCampaign(campaignId, now);
    return { id: campaignId, notice: "Kampanya onaylandı (ready)." };
  });
}

export async function runOutreachCampaignAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    await service.start(campaignId, now);
    after(() => {
      void tickOutreachDelivery().catch((error) => {
        console.error("[outreach] delivery tick failed", error);
      });
    });
    return { id: campaignId, notice: "Kampanya çalışıyor. Worker tick başlatıldı." };
  });
}

export async function pauseOutreachCampaignAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    await service.pause(campaignId, now);
    return { id: campaignId, notice: "Kampanya duraklatıldı." };
  });
}

export async function resumeOutreachCampaignAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    await service.resume(campaignId, now);
    after(() => {
      void tickOutreachDelivery().catch((error) => {
        console.error("[outreach] delivery tick failed", error);
      });
    });
    return { id: campaignId, notice: "Kampanya devam ediyor." };
  });
}

export async function tickOutreachDeliveryAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const campaignId = formString(formData, "campaignId");
  try {
    const result = await tickOutreachDelivery();
    outreachRedirect({
      id: campaignId || undefined,
      notice: `Worker tick: ${result.processed} işlendi.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tick başarısız.";
    outreachRedirect({ id: campaignId || undefined, error: message });
  }
}
