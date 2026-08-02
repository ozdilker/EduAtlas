"use server";

import {
  InstitutionNotFoundError,
  isInstitutionNotFoundError,
  syncGoogleBusiness,
} from "@eduatlas/application";
import { createInstitutionId } from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import { createGooglePlacesProviderFromEnv } from "@eduatlas/firebase/google-places";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getInstitutionRepository } from "../institutions/repository";

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
 * Admin: force-refresh Google Place details (keeps placeId when present).
 */
export async function syncGoogleBusinessAction(formData: FormData): Promise<void> {
  await runAdminGoogleSync(formData, { force: true, rematch: false });
}

/**
 * Admin: clear match and re-run Text Search (“Google Eşleşmesini Yeniden Ara”).
 */
export async function rematchGoogleBusinessAction(formData: FormData): Promise<void> {
  await runAdminGoogleSync(formData, { force: false, rematch: true });
}

async function runAdminGoogleSync(
  formData: FormData,
  options: { force: boolean; rematch: boolean },
): Promise<void> {
  const institutionId = String(formData.get("institutionId") ?? "").trim();
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "").trim());

  if (!institutionId) {
    redirect(withNotice(returnTo, "Geçersiz Google senkronizasyon isteği.", "error"));
  }

  let notice: string;
  let tone: "info" | "error" = "info";

  try {
    const institutionRepository = await getInstitutionRepository();
    const existing = await institutionRepository.getById(createInstitutionId(institutionId));
    if (!existing) {
      throw new InstitutionNotFoundError({ id: institutionId });
    }

    const geo = resolveGeoLabels(existing.location.cityId, existing.location.districtId);
    const placesProvider = createGooglePlacesProviderFromEnv();
    const result = await syncGoogleBusiness(
      {
        institutionId,
        force: options.force,
        rematch: options.rematch,
        cityName: geo.cityName,
      },
      { institutionRepository, placesProvider },
    );

    revalidatePath("/admin/review");
    revalidatePath(`/institutions/${result.institution.slug}`);

    const gb = result.institution.googleBusiness;
    if (options.rematch) {
      notice = gb?.placeId
        ? `"${result.institution.name}" için Google eşleşmesi yenilendi (${gb.placeName ?? gb.placeId}).`
        : `"${result.institution.name}" için güvenilir Google eşleşmesi bulunamadı.`;
      tone = gb?.placeId ? "info" : "error";
    } else if (result.skipped) {
      notice = `"${result.institution.name}" Google bilgileri güncel (atlandı: ${result.reason}).`;
    } else if (result.reason === "failed") {
      notice = `"${result.institution.name}" Google güncellemesi başarısız: ${gb?.lastError ?? "bilinmeyen hata"}`;
      tone = "error";
    } else {
      notice = `"${result.institution.name}" Google bilgileri güncellendi.`;
    }
  } catch (error) {
    if (isInstitutionNotFoundError(error)) {
      tone = "error";
      notice = "Kurum bulunamadı.";
    } else {
      throw error;
    }
  }

  redirect(withNotice(returnTo, notice, tone));
}
