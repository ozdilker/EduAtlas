"use server";

import { isInstitutionNotFoundError, updateInstitutionBrochure } from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { getInstitutionRepository } from "../institutions/repository";
import {
  deleteOwnerInstitutionObjectByPath,
  deleteOwnerInstitutionObjectByUrl,
  putOwnerInstitutionObject,
} from "./owner-institution-object-storage";
import { requireOwnerContext } from "./require-owner-context";

export type UpdateOwnerInstitutionBrochureState = {
  ok: boolean;
  message: string;
  brochurePdfUrl?: string;
};

const MAX_BROCHURE_BYTES = 20 * 1024 * 1024;

/**
 * Uploads brochure PDF via Admin Storage, then persists brochurePdfUrl.
 */
export async function updateOwnerInstitutionBrochureAction(
  formData: FormData,
): Promise<UpdateOwnerInstitutionBrochureState> {
  const { user, institutionId } = await requireOwnerContext();
  const file = formData.get("file");
  const previousBrochurePdfUrl = String(formData.get("previousBrochurePdfUrl") ?? "").trim();

  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, message: "Lütfen bir PDF dosyası seçin." };
  }

  const contentType = file.type.trim().toLowerCase();
  const looksLikePdf =
    contentType === "application/pdf" || file.name.trim().toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) {
    return { ok: false, message: "Yalnızca PDF dosyası yükleyebilirsiniz." };
  }
  if (file.size > MAX_BROCHURE_BYTES) {
    return { ok: false, message: "PDF en fazla 20 MB olabilir." };
  }

  let uploadedPath: string | undefined;

  try {
    const uploaded = await putOwnerInstitutionObject({
      institutionId,
      folder: "documents",
      fileName: file.name.toLowerCase().endsWith(".pdf") ? file.name : `${file.name}.pdf`,
      contentType: "application/pdf",
      data: new Uint8Array(await file.arrayBuffer()),
    });
    uploadedPath = uploaded.path;

    const institutionRepository = await getInstitutionRepository();
    const saved = await updateInstitutionBrochure(
      {
        institutionId,
        brochurePdfUrl: uploaded.downloadUrl,
        brochurePath: uploaded.path,
        updatedBy: user.uid,
      },
      { institutionRepository },
    );

    if (previousBrochurePdfUrl && previousBrochurePdfUrl !== uploaded.downloadUrl) {
      await deleteOwnerInstitutionObjectByUrl(previousBrochurePdfUrl);
    }

    revalidatePath("/owner");
    revalidatePath("/owner/profile");
    revalidatePath("/owner/media");
    revalidatePath(`/institutions/${saved.slug}`);

    return {
      ok: true,
      message: "Broşür güncellendi.",
      brochurePdfUrl: saved.brochurePdfUrl,
    };
  } catch (error) {
    await deleteOwnerInstitutionObjectByPath(uploadedPath);
    if (isInstitutionNotFoundError(error)) {
      return { ok: false, message: "Kurum bulunamadı." };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Broşür kaydedilemedi.",
    };
  }
}
