import {
  isOutreachNotFoundError,
  isOutreachValidationError,
} from "@eduatlas/application";
import { NextResponse } from "next/server";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { assertAdminPortalAccess } from "@/server/auth/guards";
import { getOutreachService } from "@/server/outreach/store";

export const dynamic = "force-dynamic";

type PreviewBody = {
  templateId?: string;
  subject?: string;
  preheader?: string;
  institutionName?: string;
};

/**
 * Live Growth Center mail preview from draft subject/preheader (no save required).
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
    const body = (await request.json()) as PreviewBody;
    const templateId = String(body.templateId ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const preheader = String(body.preheader ?? "").trim();
    const institutionName =
      String(body.institutionName ?? "").trim() || "Örnek Anaokulu";

    if (!templateId) {
      return NextResponse.json(
        { ok: false, message: "Şablon seçilmedi." },
        { status: 400 },
      );
    }
    if (!subject) {
      return NextResponse.json(
        { ok: false, message: "Konu gerekli." },
        { status: 400 },
      );
    }
    if (!preheader) {
      return NextResponse.json(
        { ok: false, message: "Preheader gerekli." },
        { status: 400 },
      );
    }

    const site = getSeoSiteConfig();
    const ctaHref = `${site.siteUrl.replace(/\/+$/, "")}/login`;
    const service = await getOutreachService();
    const rendered = await service.previewMailDraft({
      templateId,
      subject,
      preheader,
      institutionName,
      ctaHref,
    });

    return NextResponse.json({
      ok: true,
      subject: rendered.subject,
      html: rendered.html,
    });
  } catch (error) {
    console.error("[eduatlas] POST /api/admin/outreach-mail-preview failed:", error);
    const message =
      isOutreachValidationError(error) ||
      isOutreachNotFoundError(error) ||
      error instanceof Error
        ? error.message
        : "Önizleme oluşturulamadı.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
