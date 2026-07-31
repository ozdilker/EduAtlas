"use server";

import {
  deleteInstitutionMedia,
  isInstitutionNotFoundError,
  isMediaNotFoundError,
  isMediaValidationError,
  listInstitutionMedia,
  reorderInstitutionMedia,
  setPrimaryInstitutionMedia,
  uploadInstitutionMedia,
} from "@eduatlas/application";
import { MediaType, parseMediaType } from "@eduatlas/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getInstitutionRepository } from "../institutions/repository";
import { getMediaRepository, getObjectStorage } from "../media/repository";
import { requireOwnerContext } from "./require-owner-context";

function withNotice(notice: string, tone: "info" | "error"): string {
  const params = new URLSearchParams();
  params.set("notice", notice);
  params.set("noticeTone", tone);
  return `/owner/media?${params.toString()}`;
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function mediaDeps() {
  const [mediaRepository, institutionRepository, objectStorage] = await Promise.all([
    getMediaRepository(),
    getInstitutionRepository(),
    getObjectStorage(),
  ]);
  return { mediaRepository, institutionRepository, objectStorage };
}

/**
 * Upload logo / cover / gallery image through ObjectStorage + MediaRepository.
 */
export async function uploadOwnerMediaAction(formData: FormData): Promise<void> {
  const { user, institutionId } = await requireOwnerContext();
  const typeRaw = String(formData.get("type") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(withNotice("Lütfen bir görsel dosyası seçin.", "error"));
  }

  try {
    const type = parseMediaType(typeRaw);
    const deps = await mediaDeps();
    const data = new Uint8Array(await file.arrayBuffer());
    await uploadInstitutionMedia(
      {
        institutionId,
        type,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        data,
        uploadedBy: user.uid,
      },
      deps,
    );
    revalidatePath("/owner/media");
    revalidatePath("/owner/profile");
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    if (isMediaValidationError(error)) {
      redirect(
        withNotice(error.errors.length > 0 ? error.errors.join(" ") : error.message, "error"),
      );
    }
    if (isInstitutionNotFoundError(error)) {
      redirect(withNotice("Kurum bulunamadı.", "error"));
    }
    throw error;
  }

  redirect(withNotice("Görsel yüklendi.", "info"));
}

export async function deleteOwnerMediaAction(formData: FormData): Promise<void> {
  const { user, institutionId } = await requireOwnerContext();
  const mediaId = String(formData.get("mediaId") ?? "").trim();

  try {
    const deps = await mediaDeps();
    await deleteInstitutionMedia({ institutionId, mediaId, deletedBy: user.uid }, deps);
    revalidatePath("/owner/media");
    revalidatePath("/owner/profile");
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    if (isMediaNotFoundError(error) || isInstitutionNotFoundError(error)) {
      redirect(withNotice("Medya bulunamadı.", "error"));
    }
    throw error;
  }

  redirect(withNotice("Görsel silindi.", "info"));
}

export async function setPrimaryOwnerMediaAction(formData: FormData): Promise<void> {
  const { user, institutionId } = await requireOwnerContext();
  const mediaId = String(formData.get("mediaId") ?? "").trim();

  try {
    const deps = await mediaDeps();
    await setPrimaryInstitutionMedia({ institutionId, mediaId, updatedBy: user.uid }, deps);
    revalidatePath("/owner/media");
    revalidatePath("/owner/profile");
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    if (
      isMediaNotFoundError(error) ||
      isMediaValidationError(error) ||
      isInstitutionNotFoundError(error)
    ) {
      redirect(withNotice(error.message, "error"));
    }
    throw error;
  }

  redirect(withNotice("Birincil görsel güncellendi.", "info"));
}

/**
 * Moves a gallery item up/down by reconstructing the ordered id list.
 */
export async function reorderOwnerMediaAction(formData: FormData): Promise<void> {
  const { institutionId } = await requireOwnerContext();
  const mediaId = String(formData.get("mediaId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim();

  try {
    const deps = await mediaDeps();
    const gallery = await listInstitutionMedia(
      { institutionId, type: MediaType.Gallery },
      { mediaRepository: deps.mediaRepository },
    );
    const ids = gallery.map((item) => item.id.value);
    const index = ids.indexOf(mediaId);
    if (index < 0) {
      redirect(withNotice("Galeri öğesi bulunamadı.", "error"));
    }

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ids.length) {
      redirect(withNotice("Sıra değiştirilemedi.", "error"));
    }

    const ordered = [...ids];
    const current = ordered[index];
    const neighbor = ordered[swapWith];
    if (current === undefined || neighbor === undefined) {
      redirect(withNotice("Sıra değiştirilemedi.", "error"));
    }
    ordered[index] = neighbor;
    ordered[swapWith] = current;

    await reorderInstitutionMedia(
      { institutionId, orderedMediaIds: ordered, type: MediaType.Gallery },
      deps,
    );
    revalidatePath("/owner/media");
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    if (isMediaValidationError(error) || isInstitutionNotFoundError(error)) {
      redirect(withNotice(error.message, "error"));
    }
    throw error;
  }

  redirect(withNotice("Galeri sırası güncellendi.", "info"));
}
