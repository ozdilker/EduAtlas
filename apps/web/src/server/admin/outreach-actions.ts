"use server";

import {
  CLAIM_INVITATION_DEFAULT_PREHEADER,
  CLAIM_INVITATION_DEFAULT_SUBJECT,
  CLAIM_INVITATION_TEMPLATE_ID,
  ISTANBUL_UNCLAIMED_SEGMENT_ID,
  isOutreachValidationError,
} from "@eduatlas/application";
import { campaignIdAsString, isPreSendChecklistComplete, normalizeRecipientMatchScope } from "@eduatlas/domain";
import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { requireAdminSession } from "@/server/auth/current-session";
import { getEmailService } from "@/server/notifications/repository";
import { getOutreachService, tickOutreachDelivery } from "@/server/outreach/store";

function formString(formData: FormData, key: string): string {
  if (formData && typeof formData.get === "function") {
    return String(formData.get(key) ?? "").trim();
  }
  const record = formData as unknown as Record<string, unknown>;
  const value = record?.[key];
  return String(value ?? "").trim();
}

/** Next.js `redirect()` throws; must not be treated as a business error. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
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

function formMatchScope(
  formData: FormData,
  recipientSource: "segment" | "external_import" | "manual",
) {
  if (recipientSource !== "external_import" && recipientSource !== "manual") {
    return undefined;
  }
  return normalizeRecipientMatchScope({
    cityId: formString(formData, "matchCityId"),
    districtId: formString(formData, "matchDistrictId"),
  });
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
  const recipientSourceRaw = formString(formData, "recipientSource");
  const recipientSource =
    recipientSourceRaw === "external_import"
      ? "external_import"
      : recipientSourceRaw === "manual"
        ? "manual"
        : "segment";
  const recipientMatchScope = formMatchScope(formData, recipientSource);
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
        recipientSource,
        recipientMatchScope,
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
      recipientSource,
      recipientMatchScope,
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
    if (isRedirectError(error)) throw error;
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
  const institutionName = formString(formData, "institutionName");

  if (!campaignId) {
    outreachRedirect({ error: "Önce bir kampanya kaydedin." });
  }
  if (!institutionName) {
    outreachRedirect({
      id: campaignId,
      error: "Test için personalization alıcısı seçin (Preview recipient).",
    });
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
    if (isRedirectError(error)) throw error;
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
    if (isRedirectError(error)) throw error;
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

export async function importOutreachRecipientsAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const service = await getOutreachService();
  const campaignId = formString(formData, "campaignId");
  if (!campaignId) {
    outreachRedirect({ error: "Kampanya seçilmedi." });
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    outreachRedirect({ id: campaignId, error: "CSV veya XLSX dosyası seçin." });
  }
  const now = new Date().toISOString();
  try {
    const content = new Uint8Array(await file.arrayBuffer());
    const result = await service.importExternalRecipients({
      campaignId,
      fileName: file.name,
      content,
      now,
    });
    outreachRedirect({
      id: campaignId,
      notice: `Import: ${result.recipientCount} alıcı (matched ${result.matchedCount}, ambiguous ${result.match?.ambiguousCount ?? 0}, unmatched ${result.unmatchedCount}). Prepare henüz çalışmadı.`,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Import başarısız.";
    outreachRedirect({ id: campaignId, error: message });
  }
}

export async function matchOutreachRecipientsAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    const result = await service.matchCampaignRecipients({ campaignId, now });
    return {
      id: campaignId,
      notice: `Eşleştirme: matched ${result.matchedCount}, ambiguous ${result.ambiguousCount}, unmatched ${result.unmatchedCount}.`,
    };
  });
}

export async function addManualOutreachRecipientAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const service = await getOutreachService();
  const campaignId = formString(formData, "campaignId");
  if (!campaignId) {
    outreachRedirect({ error: "Kampanya seçilmedi." });
  }
  const email = formString(formData, "email");
  const displayName = formString(formData, "displayName") || undefined;
  const institutionId = formString(formData, "institutionId") || undefined;
  const now = new Date().toISOString();
  try {
    await service.addManualRecipient({
      campaignId,
      email,
      displayName,
      institutionId,
      now,
    });
    outreachRedirect({
      id: campaignId,
      notice: `Tekil alıcı eklendi: ${email}`,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Alıcı eklenemedi.";
    outreachRedirect({ id: campaignId, error: message });
  }
}

export async function assignOutreachRecipientInstitutionAction(
  formData: FormData,
): Promise<void> {
  await requireAdminSession();
  const service = await getOutreachService();
  const campaignId = formString(formData, "campaignId");
  const recipientId = formString(formData, "recipientId");
  const institutionId = formString(formData, "institutionId");
  if (!campaignId || !recipientId || !institutionId) {
    outreachRedirect({
      id: campaignId || undefined,
      error: "Kampanya, alıcı ve kurum gerekli.",
    });
  }
  const now = new Date().toISOString();
  try {
    await service.assignRecipientInstitution({
      campaignId,
      recipientId,
      institutionId,
      now,
    });
    outreachRedirect({
      id: campaignId,
      notice: "Alıcı kurumla eşleştirildi.",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Eşleştirme başarısız.";
    outreachRedirect({ id: campaignId, error: message });
  }
}

export async function prepareOutreachImportAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const service = await getOutreachService();
  const campaignId = formString(formData, "campaignId");
  if (!campaignId) {
    outreachRedirect({ error: "Kampanya seçilmedi." });
  }
  const now = new Date().toISOString();
  const file = formData.get("file");

  try {
    // Prefer prepare from persisted recipients (wizard Import step).
    // File upload remains supported for one-shot legacy prepare.
    if (file instanceof File && file.size > 0) {
      const content = new Uint8Array(await file.arrayBuffer());
      const result = await service.prepareCampaignFromImport({
        campaignId,
        fileName: file.name,
        content,
        now,
      });
      outreachRedirect({
        id: campaignId,
        notice: `Import prepare: ${result.recipientCount} alıcı (kabul ${result.parse.accepted.length}, red ${result.parse.rejected.length}, tekrar ${result.parse.duplicateEmailCount}).`,
      });
    }

    const result = await service.prepareImportedCampaign(campaignId, now);
    outreachRedirect({
      id: campaignId,
      notice: `Import prepare: ${result.recipientCount} alıcı kuyruğa alındı (toplam ${result.totalRecipients}/${result.targetLimit}).`,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Import prepare başarısız.";
    outreachRedirect({ id: campaignId, error: message });
  }
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
    if (isRedirectError(error)) throw error;
    const message = error instanceof Error ? error.message : "Tick başarısız.";
    outreachRedirect({ id: campaignId || undefined, error: message });
  }
}

export async function expandOutreachWarmupAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    const result = await service.expandWarmup(campaignId, now);
    return {
      id: campaignId,
      notice: `Expand: +${result.recipientCount} (toplam ${result.totalRecipients}/${result.targetLimit}).`,
    };
  });
}

export async function elevateOutreachWarmupStageAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const service = await getOutreachService();
  const campaignId = formString(formData, "campaignId");
  const now = new Date().toISOString();
  try {
    const settings = await service.elevateWarmupStage({
      now,
      by: session.user.uid,
      note: "Admin Stage Yükselt",
    });
    outreachRedirect({
      id: campaignId || undefined,
      notice: `Warm-up stage ${settings.stage} (limit ${settings.limits[settings.stage]}).`,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Stage yükseltilemedi.";
    outreachRedirect({ id: campaignId || undefined, error: message });
  }
}

export async function lowerOutreachWarmupStageAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const service = await getOutreachService();
  const campaignId = formString(formData, "campaignId");
  const now = new Date().toISOString();
  try {
    const settings = await service.lowerWarmupStage({
      now,
      by: session.user.uid,
      note: "Admin Stage İndir",
    });
    outreachRedirect({
      id: campaignId || undefined,
      notice: `Warm-up stage ${settings.stage} (limit ${settings.limits[settings.stage]}).`,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Stage indirilemedi.";
    outreachRedirect({ id: campaignId || undefined, error: message });
  }
}

export async function cancelOutreachCampaignAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    await service.cancel(campaignId, now);
    return { id: campaignId, notice: "Kampanya iptal edildi." };
  });
}

export async function deleteOutreachDraftCampaignAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const campaignId = formString(formData, "campaignId");
  if (!campaignId) {
    outreachRedirect({ error: "Kampanya seçilmedi." });
  }
  const service = await getOutreachService();
  try {
    await service.deleteDraft(campaignId);
    outreachRedirect({ notice: "Taslak kampanya silindi." });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Taslak silinemedi.";
    outreachRedirect({ id: campaignId, error: message });
  }
}

export async function updateOutreachPreSendChecklistAction(formData: FormData): Promise<void> {
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    // Checkbox fields are absent when unchecked; FormData.has is the reliable signal.
    const updated = await service.updatePreSendChecklist({
      campaignId,
      now,
      patch: {
        subjectOk: formData.has("subjectOk"),
        ctaOk: formData.has("ctaOk"),
        testMailSent: formData.has("testMailSent"),
        recipientsReviewed: formData.has("recipientsReviewed"),
        warmupOk: formData.has("warmupOk"),
        sendApproved: formData.has("sendApproved"),
      },
    });
    const complete = isPreSendChecklistComplete(updated.preSendChecklist);
    return {
      id: campaignId,
      notice: complete
        ? "Pre-send checklist kaydedildi — tamam (Run için uygun)."
        : "Pre-send checklist kaydedildi — hâlâ eksik madde var; Run kilitli.",
    };
  });
}

export async function updateOutreachLearningsAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const service = await getOutreachService();
  await campaignAction(formData, async (campaignId, now) => {
    await service.updateLearnings({
      campaignId,
      notes: formString(formData, "notes"),
      now,
      updatedBy: session.user.uid,
    });
    return { id: campaignId, notice: "Learning notu kaydedildi." };
  });
}
