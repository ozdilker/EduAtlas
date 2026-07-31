"use client";

import { INSTITUTION_GALLERY_MAX_IMAGES } from "@eduatlas/domain";
import {
  type OwnerGalleryUploadItem,
  OwnerInstitutionGalleryField,
} from "@eduatlas/ui";
import { useState } from "react";
import type { AppendOwnerInstitutionGalleryState } from "@/server/owner/append-owner-institution-gallery-action";
import type { RemoveOwnerInstitutionGalleryImageState } from "@/server/owner/remove-owner-institution-gallery-image-action";
import type { ReorderOwnerInstitutionGalleryState } from "@/server/owner/reorder-owner-institution-gallery-action";

const MAX_GALLERY_BYTES = 10 * 1024 * 1024;
const ALLOWED_GALLERY_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type OwnerInstitutionGalleryUploadProps = {
  institutionName: string;
  galleryImages?: readonly string[];
  appendGalleryAction: (formData: FormData) => Promise<AppendOwnerInstitutionGalleryState>;
  removeGalleryImageAction: (input: {
    imageUrl: string;
  }) => Promise<RemoveOwnerInstitutionGalleryImageState>;
  reorderGalleryAction: (input: {
    imageUrls: readonly string[];
  }) => Promise<ReorderOwnerInstitutionGalleryState>;
};

function createUploadId(): string {
  return `gallery_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Multi-file gallery upload + delete via server action + Admin Storage.
 */
export function OwnerInstitutionGalleryUpload({
  institutionName,
  galleryImages: initialImages = [],
  appendGalleryAction,
  removeGalleryImageAction,
  reorderGalleryAction,
}: OwnerInstitutionGalleryUploadProps) {
  const [images, setImages] = useState<string[]>([...initialImages]);
  const [uploads, setUploads] = useState<OwnerGalleryUploadItem[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  function validateFile(file: File): string | undefined {
    const type = file.type.trim().toLowerCase();
    if (!ALLOWED_GALLERY_TYPES.has(type)) {
      return "Yalnızca JPG, JPEG, PNG veya WEBP yükleyebilirsiniz.";
    }
    if (file.size <= 0 || file.size > MAX_GALLERY_BYTES) {
      return "Görsel en fazla 10 MB olabilir.";
    }
    return undefined;
  }

  async function handleDeleteImage(imageUrl: string) {
    if (busy || deletingUrl || reordering) {
      return;
    }

    const confirmed = window.confirm("Bu galeri görselini silmek istediğinize emin misiniz?");
    if (!confirmed) {
      return;
    }

    setError(undefined);
    setMessage(undefined);
    setDeletingUrl(imageUrl);

    const persist = await removeGalleryImageAction({ imageUrl });
    if (!persist.ok) {
      setDeletingUrl(null);
      setError(persist.message || "Galeri görseli silinemedi.");
      setMessage(undefined);
      return;
    }

    setImages([...(persist.galleryImages ?? [])]);
    setMessage(persist.message || "Galeri görseli silindi.");
    setError(undefined);
    setDeletingUrl(null);
  }

  async function handleReorderImages(orderedUrls: readonly string[]) {
    if (busy || deletingUrl || reordering) {
      return;
    }

    const previous = [...images];
    setImages([...orderedUrls]);
    setError(undefined);
    setMessage(undefined);
    setReordering(true);

    const persist = await reorderGalleryAction({ imageUrls: orderedUrls });
    if (!persist.ok) {
      setImages(previous);
      setError(persist.message || "Galeri sırası kaydedilemedi.");
      setMessage(undefined);
      setReordering(false);
      return;
    }

    setImages([...(persist.galleryImages ?? orderedUrls)]);
    setMessage(persist.message || "Galeri sırası güncellendi.");
    setError(undefined);
    setReordering(false);
  }

  async function handleFilesSelected(files: File[]) {
    if (busy || deletingUrl || reordering) {
      return;
    }

    setError(undefined);
    setMessage(undefined);

    const remainingSlots = INSTITUTION_GALLERY_MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setError(`Galeri en fazla ${INSTITUTION_GALLERY_MAX_IMAGES} görsel içerebilir.`);
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);
    const skippedForLimit = files.length - acceptedFiles.length;

    const validationErrors: string[] = [];
    const validFiles: File[] = [];
    for (const file of acceptedFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        validationErrors.push(`${file.name}: ${validationError}`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setError(validationErrors[0] || "Hiçbir görsel yüklenemedi.");
      return;
    }

    const jobs: OwnerGalleryUploadItem[] = validFiles.map((file) => ({
      id: createUploadId(),
      fileName: file.name,
      progress: 20,
      status: "uploading",
    }));

    setUploads(jobs);
    setBusy(true);

    if (skippedForLimit > 0) {
      setError(
        `Limit nedeniyle ${skippedForLimit} dosya atlandı (en fazla ${INSTITUTION_GALLERY_MAX_IMAGES} görsel).`,
      );
    } else if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
    }

    try {
      setUploads((current) => current.map((item) => ({ ...item, progress: 60 })));

      const formData = new FormData();
      for (const file of validFiles) {
        formData.append("files", file);
      }

      const persist = await appendGalleryAction(formData);
      if (!persist.ok) {
        setUploads((current) =>
          current.map((item) => ({
            ...item,
            status: "error",
            error: persist.message || "Galeri kaydedilemedi.",
            progress: 0,
          })),
        );
        setError(persist.message || "Galeri kaydedilemedi.");
        setMessage(undefined);
        setBusy(false);
        return;
      }

      setUploads((current) =>
        current.map((item) => ({
          ...item,
          progress: 100,
          status: "success",
        })),
      );
      setImages([...(persist.galleryImages ?? [])]);
      setMessage(persist.message);
      setBusy(false);
      setUploads([]);
    } catch (uploadError) {
      const messageText =
        uploadError instanceof Error ? uploadError.message : "Yükleme başarısız oldu.";
      setUploads((current) =>
        current.map((item) => ({
          ...item,
          status: "error",
          error: messageText,
          progress: 0,
        })),
      );
      setError(messageText);
      setBusy(false);
    }
  }

  return (
    <OwnerInstitutionGalleryField
      institutionName={institutionName}
      images={images}
      maxImages={INSTITUTION_GALLERY_MAX_IMAGES}
      uploads={uploads}
      error={error}
      message={message}
      disabled={busy}
      deletingUrl={deletingUrl}
      reordering={reordering}
      onFilesSelected={handleFilesSelected}
      onDeleteImage={handleDeleteImage}
      onReorderImages={handleReorderImages}
    />
  );
}
