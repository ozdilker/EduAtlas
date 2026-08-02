import { isImportFileError } from "@eduatlas/application";
import type { AdminImportFormState } from "@eduatlas/ui";
import { ADMIN_IMPORT_INITIAL_STATE } from "@eduatlas/ui";
import { NextResponse } from "next/server";
import { readImportUploadBytes } from "@/server/admin/read-import-upload-bytes";
import { runAdminImportPreview } from "@/server/admin/run-admin-import-preview";
import { assertAdminPortalAccess } from "@/server/auth/guards";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Multipart preview endpoint for large MEB uploads.
 * Avoids Next.js server-action / RSC Flight limits; clients may gzip >3.5MB files.
 */
export async function POST(request: Request) {
  try {
    await assertAdminPortalAccess("/admin/import");
  } catch {
    return NextResponse.json(
      {
        ...ADMIN_IMPORT_INITIAL_STATE,
        phase: "error",
        message: "Oturum gerekli. Yeniden giriş yapıp tekrar deneyin.",
      } satisfies AdminImportFormState,
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        {
          ...ADMIN_IMPORT_INITIAL_STATE,
          phase: "error",
          message: "Lütfen bir .csv, .xlsx veya .xls dosyası seçin.",
        } satisfies AdminImportFormState,
        { status: 400 },
      );
    }

    const encodingHint = String(formData.get("contentEncoding") ?? "");
    const originalName = String(formData.get("originalFileName") ?? "").trim();
    const fileName =
      originalName ||
      (file.name.toLowerCase().endsWith(".gz") ? file.name.slice(0, -3) : file.name);
    const content = await readImportUploadBytes(file, encodingHint);
    const state = await runAdminImportPreview({
      fileName,
      content,
    });
    return NextResponse.json(state);
  } catch (error) {
    console.error("[eduatlas] POST /api/admin/import-preview failed:", error);
    const message = isImportFileError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Önizleme sırasında beklenmeyen bir hata oluştu.";
    return NextResponse.json(
      {
        ...ADMIN_IMPORT_INITIAL_STATE,
        phase: "error",
        message,
      } satisfies AdminImportFormState,
      { status: 500 },
    );
  }
}
