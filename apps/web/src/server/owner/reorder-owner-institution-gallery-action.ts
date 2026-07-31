"use server";

import {
  isInstitutionNotFoundError,
  isInstitutionProfileValidationError,
  reorderInstitutionGalleryImages,
} from "@eduatlas/application";
import { revalidatePath } from "next/cache";
import { getInstitutionRepository } from "../institutions/repository";
import { requireOwnerContext } from "./require-owner-context";

export type ReorderOwnerInstitutionGalleryState = {
  ok: boolean;
  message: string;
  galleryImages?: readonly string[];
};

/**
 * Persists a new galleryImages order (no Storage I/O).
 */
export async function reorderOwnerInstitutionGalleryAction(input: {
  imageUrls: readonly string[];
}): Promise<ReorderOwnerInstitutionGalleryState> {
  const { user, institutionId } = await requireOwnerContext();
  const imageUrls = (input.imageUrls ?? []).map((url) => String(url).trim()).filter(Boolean);

  if (imageUrls.length === 0) {
    return { ok: false, message: "Sıralanacak galeri görseli yok." };
  }

  try {
    const institutionRepository = await getInstitutionRepository();
    const saved = await reorderInstitutionGalleryImages(
      {
        institutionId,
        imageUrls,
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
      message: "Galeri sırası güncellendi.",
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
      message: error instanceof Error ? error.message : "Galeri sırası kaydedilemedi.",
    };
  }
}
