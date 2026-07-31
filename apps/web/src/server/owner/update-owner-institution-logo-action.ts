"use server";

import { isInstitutionNotFoundError, updateInstitutionLogo } from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { getInstitutionRepository } from "../institutions/repository";
import {
  deleteOwnerInstitutionObjectByPath,
  putOwnerInstitutionObject,
} from "./owner-institution-object-storage";
import { requireOwnerContext } from "./require-owner-context";

export type UpdateOwnerInstitutionLogoState = {
  ok: boolean;
  message: string;
  logoUrl?: string;
};

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Uploads logo via Admin Storage, then persists logoUrl on the owner institution.
 */
export async function updateOwnerInstitutionLogoAction(
  formData: FormData,
): Promise<UpdateOwnerInstitutionLogoState> {
  const { user, institutionId } = await requireOwnerContext();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, message: "Lütfen bir logo dosyası seçin." };
  }

  const contentType = file.type.trim().toLowerCase();
  if (!ALLOWED_LOGO_TYPES.has(contentType)) {
    return { ok: false, message: "Yalnızca JPG, JPEG, PNG veya WEBP yükleyebilirsiniz." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, message: "Logo en fazla 5 MB olabilir." };
  }

  let uploadedPath: string | undefined;

  try {
    const uploaded = await putOwnerInstitutionObject({
      institutionId,
      folder: "logo",
      fileName: file.name,
      contentType,
      data: new Uint8Array(await file.arrayBuffer()),
    });
    uploadedPath = uploaded.path;

    const institutionRepository = await getInstitutionRepository();
    const saved = await updateInstitutionLogo(
      {
        institutionId,
        logoUrl: uploaded.downloadUrl,
        logoPath: uploaded.path,
        updatedBy: user.uid,
      },
      { institutionRepository },
    );

    revalidatePath("/owner");
    revalidatePath("/owner/profile");
    revalidatePath("/owner/media");
    revalidatePath(`/institutions/${saved.slug}`);

    return {
      ok: true,
      message: "Logo güncellendi.",
      logoUrl: saved.logoUrl,
    };
  } catch (error) {
    await deleteOwnerInstitutionObjectByPath(uploadedPath);
    if (isInstitutionNotFoundError(error)) {
      return { ok: false, message: "Kurum bulunamadı." };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Logo kaydedilemedi.",
    };
  }
}
