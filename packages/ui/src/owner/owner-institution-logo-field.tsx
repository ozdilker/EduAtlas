"use client";

import { useId, useRef } from "react";
import { Button } from "../components/button";
import { cn } from "../lib/cn";

const LOGO_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export type OwnerInstitutionLogoFieldProps = {
  institutionName: string;
  logoUrl?: string;
  /** Upload progress percentage; null/undefined when idle. */
  progress?: number | null;
  error?: string;
  message?: string;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  className?: string;
};

/**
 * Logo preview + file picker for the owner profile form.
 * Upload/storage wiring is provided by the host app (no Firebase in UI package).
 */
export function OwnerInstitutionLogoField({
  institutionName,
  logoUrl,
  progress = null,
  error,
  message,
  disabled = false,
  onFileSelected,
  className,
}: OwnerInstitutionLogoFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = typeof progress === "number";

  return (
    <div className={cn("ea-owner-profile-logo", className)}>
      <div className="ea-owner-profile-logo__preview" aria-live="polite">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${institutionName} logosu`}
            className="ea-owner-profile-logo__image"
          />
        ) : (
          <div className="ea-owner-profile-logo__placeholder" role="img" aria-label="Logo yok">
            <span>Logo yok</span>
          </div>
        )}
      </div>

      <div className="ea-owner-profile-logo__actions">
        <input
          ref={inputRef}
          id={inputId}
          className="ea-owner-profile-logo__input"
          type="file"
          accept={LOGO_ACCEPT}
          disabled={disabled || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              onFileSelected(file);
            }
          }}
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Yükleniyor…" : "Logo Değiştir"}
        </Button>
        <p className="ea-owner-profile-logo__hint">JPG, JPEG, PNG veya WEBP · en fazla 5 MB</p>
      </div>

      {uploading ? (
        <div
          className="ea-owner-profile-logo__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress ?? 0}
          aria-label="Logo yükleme ilerleme"
        >
          <div className="ea-owner-profile-logo__progress-track">
            <div
              className="ea-owner-profile-logo__progress-bar"
              style={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
            />
          </div>
          <span className="ea-owner-profile-logo__progress-label">{progress ?? 0}%</span>
        </div>
      ) : null}

      {error ? (
        <p className="ea-owner-profile-logo__status ea-owner-profile-logo__status--error" role="alert">
          {error}
        </p>
      ) : null}

      {!error && message ? (
        <p
          className="ea-owner-profile-logo__status ea-owner-profile-logo__status--success"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
