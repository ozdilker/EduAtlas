import {
  isOutreachValidationError,
  parseOutreachRecipientImport,
} from "@eduatlas/application";
import { NextResponse } from "next/server";
import { assertAdminPortalAccess } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Validates Growth Center Excel/CSV recipient import without writing recipients/jobs.
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
    const file = formData.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { ok: false, message: "Lütfen bir .csv veya .xlsx dosyası seçin." },
        { status: 400 },
      );
    }

    const content = new Uint8Array(await file.arrayBuffer());
    const parse = parseOutreachRecipientImport({
      fileName: file.name,
      content,
    });

    return NextResponse.json({
      ok: true,
      fileName: parse.fileName,
      rowCount: parse.rowCount,
      acceptedCount: parse.accepted.length,
      rejectedCount: parse.rejected.length,
      duplicateEmailCount: parse.duplicateEmailCount,
      accepted: parse.accepted.slice(0, 50),
      rejected: parse.rejected.slice(0, 50),
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
