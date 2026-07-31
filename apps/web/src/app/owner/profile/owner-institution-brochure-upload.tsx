"use client";

import { OwnerInstitutionBrochureField } from "@eduatlas/ui";
import { useState, useTransition } from "react";
import type { RemoveOwnerInstitutionBrochureState } from "@/server/owner/remove-owner-institution-brochure-action";
import type { UpdateOwnerInstitutionBrochureState } from "@/server/owner/update-owner-institution-brochure-action";

const MAX_BROCHURE_BYTES = 20 * 1024 * 1024;
const ALLOWED_BROCHURE_TYPES = new Set(["application/pdf"]);

export type OwnerInstitutionBrochureUploadProps = {
  brochurePdfUrl?: string;
  updateBrochureAction: (formData: FormData) => Promise<UpdateOwnerInstitutionBrochureState>;
  removeBrochureAction: (input: {
    brochurePdfUrl: string;
  }) => Promise<RemoveOwnerInstitutionBrochureState>;
};

/**
 * Brochure PDF upload/replace/delete via server action + Admin Storage.
 */
export function OwnerInstitutionBrochureUpload({
  brochurePdfUrl: initialBrochurePdfUrl,
  updateBrochureAction,
  removeBrochureAction,
}: OwnerInstitutionBrochureUploadProps) {
  const [brochurePdfUrl, setBrochurePdfUrl] = useState(initialBrochurePdfUrl);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const busy = progress !== null || pending;

  function validateFile(file: File): string | undefined {
    const type = file.type.trim().toLowerCase();
    const looksLikePdf =
      ALLOWED_BROCHURE_TYPES.has(type) || file.name.trim().toLowerCase().endsWith(".pdf");
    if (!looksLikePdf) {
      return "Yalnızca PDF dosyası yükleyebilirsiniz.";
    }
    if (file.size <= 0 || file.size > MAX_BROCHURE_BYTES) {
      return "PDF en fazla 20 MB olabilir.";
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

    const previousBrochurePdfUrl = brochurePdfUrl;
    setError(undefined);
    setMessage(undefined);
    setProgress(15);

    const formData = new FormData();
    formData.set("file", file);
    if (previousBrochurePdfUrl) {
      formData.set("previousBrochurePdfUrl", previousBrochurePdfUrl);
    }

    startTransition(() => {
      void (async () => {
        try {
          setProgress(55);
          const result = await updateBrochureAction(formData);
          if (!result.ok) {
            setBrochurePdfUrl(previousBrochurePdfUrl);
            setError(result.message || "Broşür kaydedilemedi.");
            setMessage(undefined);
            setProgress(null);
            return;
          }

          setProgress(100);
          setBrochurePdfUrl(result.brochurePdfUrl ?? previousBrochurePdfUrl);
          setMessage(result.message || "Broşür güncellendi.");
          setError(undefined);
          setProgress(null);
        } catch (uploadError) {
          setBrochurePdfUrl(previousBrochurePdfUrl);
          setProgress(null);
          setMessage(undefined);
          setError(
            uploadError instanceof Error ? uploadError.message : "Broşür yükleme başarısız oldu.",
          );
        }
      })();
    });
  }

  function handleDelete() {
    if (!brochurePdfUrl) {
      return;
    }
    if (!window.confirm("Broşürü silmek istediğinize emin misiniz?")) {
      return;
    }

    const urlToDelete = brochurePdfUrl;
    setError(undefined);
    setMessage(undefined);

    startTransition(() => {
      void (async () => {
        const result = await removeBrochureAction({ brochurePdfUrl: urlToDelete });
        if (!result.ok) {
          setError(result.message || "Broşür silinemedi.");
          setMessage(undefined);
          return;
        }

        setBrochurePdfUrl(undefined);
        setMessage(result.message || "Broşür silindi.");
        setError(undefined);
      })();
    });
  }

  return (
    <OwnerInstitutionBrochureField
      brochurePdfUrl={brochurePdfUrl}
      progress={progress}
      error={error}
      message={message}
      disabled={busy}
      onFileSelected={handleFileSelected}
      onDelete={handleDelete}
    />
  );
}
