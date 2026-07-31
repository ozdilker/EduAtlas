"use client";

import { OwnerInstitutionCoverField } from "@eduatlas/ui";
import { useState, useTransition } from "react";
import type { UpdateOwnerInstitutionCoverState } from "@/server/owner/update-owner-institution-cover-action";

const MAX_COVER_BYTES = 10 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type OwnerInstitutionCoverUploadProps = {
  institutionName: string;
  coverImageUrl?: string;
  updateCoverAction: (formData: FormData) => Promise<UpdateOwnerInstitutionCoverState>;
};

/**
 * Cover upload via server action + Admin Storage (session cookie auth).
 */
export function OwnerInstitutionCoverUpload({
  institutionName,
  coverImageUrl: initialCoverImageUrl,
  updateCoverAction,
}: OwnerInstitutionCoverUploadProps) {
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const uploading = progress !== null || pending;

  function validateFile(file: File): string | undefined {
    const type = file.type.trim().toLowerCase();
    if (!ALLOWED_COVER_TYPES.has(type)) {
      return "Yalnızca JPG, JPEG, PNG veya WEBP yükleyebilirsiniz.";
    }
    if (file.size <= 0 || file.size > MAX_COVER_BYTES) {
      return "Kapak fotoğrafı en fazla 10 MB olabilir.";
    }
    return undefined;
  }

  function handleFileSelected(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setMessage(undefined);
      return;
    }

    const previousCoverImageUrl = coverImageUrl;
    setError(undefined);
    setMessage(undefined);
    setProgress(15);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(() => {
      void (async () => {
        try {
          setProgress(55);
          const result = await updateCoverAction(formData);
          if (!result.ok) {
            setCoverImageUrl(previousCoverImageUrl);
            setError(result.message || "Kapak fotoğrafı kaydedilemedi.");
            setMessage(undefined);
            setProgress(null);
            return;
          }

          setProgress(100);
          setCoverImageUrl(result.coverImageUrl ?? previousCoverImageUrl);
          setMessage(result.message || "Kapak fotoğrafı güncellendi.");
          setError(undefined);
          setProgress(null);
        } catch (uploadError) {
          setCoverImageUrl(previousCoverImageUrl);
          setProgress(null);
          setMessage(undefined);
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "Kapak fotoğrafı yükleme başarısız oldu.",
          );
        }
      })();
    });
  }

  return (
    <OwnerInstitutionCoverField
      institutionName={institutionName}
      coverImageUrl={coverImageUrl}
      progress={progress}
      error={error}
      message={message}
      disabled={uploading}
      onFileSelected={handleFileSelected}
    />
  );
}
