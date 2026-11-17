import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { grantInstitutionContactUnlock } from "@/server/leads/contact-unlock-cookie";
import {
  isPreviewContactUnlockFixtureEnabled,
  PREVIEW_UNLOCK_INSTITUTION,
  shouldGrantPreviewContactUnlock,
} from "../fixture-data";

/**
 * Document POST for the preview fixture.
 * A streaming Server Action can render the unlocked page from the in-memory
 * cookie jar without the browser storing Set-Cookie. This handler finishes
 * with a 303 and the grant cookie on that response.
 * Does not persist a lead, notify anyone, or touch Firestore.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isPreviewContactUnlockFixtureEnabled()) {
    notFound();
  }

  const contentType = request.headers.get("content-type") ?? "";
  const formEncoded =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");
  if (!formEncoded) {
    return NextResponse.json({ ok: false, message: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const institutionId = String(formData.get("institutionId") ?? "");
  if (shouldGrantPreviewContactUnlock("success", institutionId)) {
    await grantInstitutionContactUnlock(PREVIEW_UNLOCK_INSTITUTION.id);
  }

  return NextResponse.redirect(new URL("/preview/contact-unlock", request.url), 303);
}
