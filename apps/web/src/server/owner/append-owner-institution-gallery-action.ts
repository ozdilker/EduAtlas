"use server";

import {
  appendInstitutionGalleryImages,
  isInstitutionNotFoundError,
  isInstitutionProfileValidationError,
} from "@eduatlas/application";
import { createInstitutionId, INSTITUTION_GALLERY_MAX_IMAGES } from "@eduatlas/domain";
import { revalidatePath } from "next/cache";
import { getInstitutionRepository } from "../institutions/repository";
import {
  deleteOwnerInstitutionObjectByPath,
  putOwnerInstitutionObject,
} from "./owner-institution-object-storage";
import { requireOwnerContext } from "./require-owner-context";

export type AppendOwnerInstitutionGalleryState = {
  ok: boolean;
  message: string;
  galleryImages?: readonly string[];
};

const MAX_GALLERY_BYTES = 10 * 1024 * 1024;
const ALLOWED_GALLERY_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Uploads gallery images via Admin Storage, then appends URLs on the institution.
 */
export async function appendOwnerInstitutionGalleryAction(
  formData: FormData,
): Promise<AppendOwnerInstitutionGalleryState> {
  const { user, institutionId } = await requireOwnerContext();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return { ok: false, message: "Eklenecek galeri görseli yok." };
  }

  const institutionRepository = await getInstitutionRepository();
  const institution = await institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    return { ok: false, message: "Kurum bulunamadı." };
  }

  const currentCount = institution.galleryImages?.length ?? 0;
  const remainingSlots = INSTITUTION_GALLERY_MAX_IMAGES - currentCount;
  if (remainingSlots <= 0) {
    return {
      ok: false,
      message: `Galeri en fazla ${INSTITUTION_GALLERY_MAX_IMAGES} görsel içerebilir.`,
    };
  }

  const accepted = files.slice(0, remainingSlots);
  const uploadedPaths: string[] = [];
  const imageUrls: string[] = [];

  try {
    for (const file of accepted) {
      const contentType = file.type.trim().toLowerCase();
      if (!ALLOWED_GALLERY_TYPES.has(contentType)) {
        return { ok: false, message: "Yalnızca JPG, JPEG, PNG veya WEBP yükleyebilirsiniz." };
      }
      if (file.size > MAX_GALLERY_BYTES) {
        return { ok: false, message: "Görsel en fazla 10 MB olabilir." };
      }

      const uploaded = await putOwnerInstitutionObject({
        institutionId,
        folder: "gallery",
        fileName: file.name,
        contentType,
        data: new Uint8Array(await file.arrayBuffer()),
      });
      uploadedPaths.push(uploaded.path);
      imageUrls.push(uploaded.downloadUrl);
    }

    const saved = await appendInstitutionGalleryImages(
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
      message:
        imageUrls.length === 1
          ? "Galeri görseli eklendi."
          : `${imageUrls.length} galeri görseli eklendi.`,
      galleryImages: saved.galleryImages ?? [],
    };
  } catch (error) {
    await Promise.all(uploadedPaths.map((path) => deleteOwnerInstitutionObjectByPath(path)));
    if (isInstitutionNotFoundError(error)) {
      return { ok: false, message: "Kurum bulunamadı." };
    }
    if (isInstitutionProfileValidationError(error)) {
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Galeri güncellenemedi.",
    };
  }
}
