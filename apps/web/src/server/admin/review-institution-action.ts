"use server";

import {
  isInstitutionNotFoundError,
  isReviewAction,
  isReviewValidationError,
  reviewInstitution,
} from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getInstitutionRepository } from "../institutions/repository";

const ADMIN_DEMO_REVIEWER = "admin_demo";

function safeReturnTo(raw: string): string {
  return raw.startsWith("/admin/review") ? raw : "/admin/review";
}

function withNotice(returnTo: string, notice: string, tone: "info" | "error"): string {
  const [path, query = ""] = returnTo.split("?");
  const params = new URLSearchParams(query);
  params.set("notice", notice);
  params.set("noticeTone", tone);
  return `${path}?${params.toString()}`;
}

/**
 * Server action: review panel decision → reviewInstitution application service.
 * Human-initiated only; no automation.
 */
export async function reviewInstitutionAction(formData: FormData): Promise<void> {
  const institutionId = String(formData.get("institutionId") ?? "").trim();
  const actionRaw = String(formData.get("reviewActionType") ?? "").trim();
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "").trim());

  if (!institutionId || !isReviewAction(actionRaw)) {
    redirect(withNotice(returnTo, "Geçersiz inceleme isteği.", "error"));
  }

  let notice: string;
  let tone: "info" | "error" = "info";

  try {
    const institutionRepository = await getInstitutionRepository();
    const result = await reviewInstitution(
      { institutionId, action: actionRaw, reviewedBy: ADMIN_DEMO_REVIEWER },
      { institutionRepository },
    );

    revalidatePath("/admin/review");
    revalidatePath("/admin/acquisition");
    revalidatePath(`/institutions/${result.institution.slug}`);

    notice =
      actionRaw === "publish"
        ? `"${result.institution.name}" yayınlandı.`
        : actionRaw === "reject"
          ? `"${result.institution.name}" reddedildi (arşive taşındı).`
          : `"${result.institution.name}" taslağa döndürüldü.`;
  } catch (error) {
    if (isReviewValidationError(error)) {
      tone = "error";
      notice =
        error.errors.length > 0 ? `${error.message} ${error.errors.join("; ")}` : error.message;
    } else if (isInstitutionNotFoundError(error)) {
      tone = "error";
      notice = "Kurum bulunamadı.";
    } else {
      throw error;
    }
  }

  redirect(withNotice(returnTo, notice, tone));
}
