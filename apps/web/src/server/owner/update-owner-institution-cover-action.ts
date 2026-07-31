"use server";

import { isInstitutionNotFoundError, updateInstitutionCover } from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { getInstitutionRepository } from "../institutions/repository";
import {
  deleteOwnerInstitutionObjectByPath,
  putOwnerInstitutionObject,
} from "./owner-institution-object-storage";
import { requireOwnerContext } from "./require-owner-context";

export type UpdateOwnerInstitutionCoverState = {
  ok: boolean;
  message: string;
  coverImageUrl?: string;
};

const MAX_COVER_BYTES = 10 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Uploads cover via Admin Storage, then persists coverImageUrl.
 */
export async function updateOwnerInstitutionCoverAction(
  formData: FormData,
): Promise<UpdateOwnerInstitutionCoverState> {
  const { user, institutionId } = await requireOwnerContext();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, message: "Lütfen bir kapak fotoğrafı seçin." };
  }

  const contentType = file.type.trim().toLowerCase();
  if (!ALLOWED_COVER_TYPES.has(contentType)) {
    return { ok: false, message: "Yalnızca JPG, JPEG, PNG veya WEBP yükleyebilirsiniz." };
  }
  if (file.size > MAX_COVER_BYTES) {
    return { ok: false, message: "Kapak fotoğrafı en fazla 10 MB olabilir." };
  }

  let uploadedPath: string | undefined;

  try {
    const uploaded = await putOwnerInstitutionObject({
      institutionId,
      folder: "cover",
      fileName: file.name,
      contentType,
      data: new Uint8Array(await file.arrayBuffer()),
    });
    uploadedPath = uploaded.path;

    const institutionRepository = await getInstitutionRepository();
    const saved = await updateInstitutionCover(
      {
        institutionId,
        coverImageUrl: uploaded.downloadUrl,
        coverPath: uploaded.path,
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
      message: "Kapak fotoğrafı güncellendi.",
      coverImageUrl: saved.coverImageUrl,
    };
  } catch (error) {
    await deleteOwnerInstitutionObjectByPath(uploadedPath);
    if (isInstitutionNotFoundError(error)) {
      return { ok: false, message: "Kurum bulunamadı." };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Kapak fotoğrafı kaydedilemedi.",
    };
  }
}
