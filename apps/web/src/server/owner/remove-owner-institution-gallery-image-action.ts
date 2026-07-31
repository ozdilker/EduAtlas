"use server";

import {
  isInstitutionNotFoundError,
  isInstitutionProfileValidationError,
  removeInstitutionGalleryImage,
} from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { getInstitutionRepository } from "../institutions/repository";
import { deleteOwnerInstitutionObjectByUrl } from "./owner-institution-object-storage";
import { requireOwnerContext } from "./require-owner-context";

export type RemoveOwnerInstitutionGalleryImageState = {
  ok: boolean;
  message: string;
  galleryImages?: readonly string[];
};

/**
 * Deletes gallery object (best-effort) and removes URL from the institution.
 */
export async function removeOwnerInstitutionGalleryImageAction(input: {
  imageUrl: string;
}): Promise<RemoveOwnerInstitutionGalleryImageState> {
  const { user, institutionId } = await requireOwnerContext();
  const imageUrl = String(input.imageUrl ?? "").trim();

  if (!imageUrl) {
    return { ok: false, message: "Silinecek galeri görseli belirtilmedi." };
  }

  try {
    await deleteOwnerInstitutionObjectByUrl(imageUrl);

    const institutionRepository = await getInstitutionRepository();
    const saved = await removeInstitutionGalleryImage(
      {
        institutionId,
        imageUrl,
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
      message: "Galeri görseli silindi.",
      galleryImages: saved.galleryImages ?? [],
    };
  } catch (error) {
    if (isInstitutionNotFoundError(error)) {
      return { ok: false, message: "Kurum bulunamadı." };
    }
    if (isInstitutionProfileValidationError(error)) {
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Galeri görseli silinemedi.",
    };
  }
}
