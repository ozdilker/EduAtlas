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
import { redirect } from "next/navigation";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { requireAdminSession } from "@/server/auth/current-session";
import { getEmailService } from "@/server/notifications/repository";
import { getOutreachService } from "@/server/outreach/store";

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

/**
 * Create or update an outreach campaign (in-memory).
 */
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

/**
 * Send a single test email for the selected campaign.
 */
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
