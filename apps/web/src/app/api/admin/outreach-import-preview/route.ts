import {
  isOutreachValidationError,
  parseOutreachRecipientImport,
} from "@eduatlas/application";
import { NextResponse } from "next/server";
import { assertAdminPortalAccess } from "@/server/auth/guards";
import { getOutreachService } from "@/server/outreach/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Validates Excel/CSV and persists Pending CampaignRecipients (no DeliveryJobs).
 * Requires campaignId — source of truth is Firestore, not browser state.
 */
export async function POST(request: Request) {
  try {
    await assertAdminPortalAccess("/admin/outreach");
  } catch {
    return NextResponse.json(
      { ok: false, message: "Oturum gerekli. Yeniden giriş yapıp tekrar deneyin." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const campaignId = String(formData.get("campaignId") ?? "").trim();
    const file = formData.get("file");
    if (!campaignId) {
      return NextResponse.json(
        { ok: false, message: "Önce kampanyayı kaydedin, sonra Excel/CSV yükleyin." },
        { status: 400 },
      );
    }
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { ok: false, message: "Lütfen bir .csv veya .xlsx dosyası seçin." },
        { status: 400 },
      );
    }

    const content = new Uint8Array(await file.arrayBuffer());
    // Fast validate before persistence (clearer errors for empty/invalid files).
    parseOutreachRecipientImport({
      fileName: file.name,
      content,
    });

    const service = await getOutreachService();
    const result = await service.importExternalRecipients({
      campaignId,
      fileName: file.name,
      content,
      now: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      persisted: true,
      fileName: result.parse.fileName,
      rowCount: result.parse.rowCount,
      acceptedCount: result.parse.accepted.length,
      rejectedCount: result.parse.rejected.length,
      duplicateEmailCount: result.parse.duplicateEmailCount,
      matchedCount: result.matchedCount,
      unmatchedCount: result.unmatchedCount,
      recipientCount: result.recipientCount,
      accepted: result.parse.accepted.slice(0, 50),
      rejected: result.parse.rejected.slice(0, 50),
    });
  } catch (error) {
    console.error("[eduatlas] POST /api/admin/outreach-import-preview failed:", error);
    const message =
      isOutreachValidationError(error) || error instanceof Error
        ? error.message
        : "Önizleme sırasında beklenmeyen bir hata oluştu.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
