"use client";

import { OwnerInstitutionLogoField } from "@eduatlas/ui";
import { useState, useTransition } from "react";
import type { UpdateOwnerInstitutionLogoState } from "@/server/owner/update-owner-institution-logo-action";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type OwnerInstitutionLogoUploadProps = {
  institutionName: string;
  logoUrl?: string;
  updateLogoAction: (formData: FormData) => Promise<UpdateOwnerInstitutionLogoState>;
};

/**
 * Logo upload via server action + Admin Storage (session cookie auth).
 */
export function OwnerInstitutionLogoUpload({
  institutionName,
  logoUrl: initialLogoUrl,
  updateLogoAction,
}: OwnerInstitutionLogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const uploading = progress !== null || pending;

  function validateFile(file: File): string | undefined {
    const type = file.type.trim().toLowerCase();
    if (!ALLOWED_LOGO_TYPES.has(type)) {
      return "Yalnızca JPG, JPEG, PNG veya WEBP yükleyebilirsiniz.";
    }
    if (file.size <= 0 || file.size > MAX_LOGO_BYTES) {
      return "Logo en fazla 5 MB olabilir.";
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

    const previousLogoUrl = logoUrl;
    setError(undefined);
    setMessage(undefined);
    setProgress(15);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(() => {
      void (async () => {
        try {
          setProgress(55);
          const result = await updateLogoAction(formData);
          if (!result.ok) {
            setLogoUrl(previousLogoUrl);
            setError(result.message || "Logo kaydedilemedi.");
            setMessage(undefined);
            setProgress(null);
            return;
          }

          setProgress(100);
          setLogoUrl(result.logoUrl ?? previousLogoUrl);
          setMessage(result.message || "Logo güncellendi.");
          setError(undefined);
          setProgress(null);
        } catch (uploadError) {
          setLogoUrl(previousLogoUrl);
          setProgress(null);
          setMessage(undefined);
          setError(
            uploadError instanceof Error ? uploadError.message : "Logo yükleme başarısız oldu.",
          );
        }
      })();
    });
  }

  return (
    <OwnerInstitutionLogoField
      institutionName={institutionName}
      logoUrl={logoUrl}
      progress={progress}
      error={error}
      message={message}
      disabled={uploading}
      onFileSelected={handleFileSelected}
    />
  );
}
