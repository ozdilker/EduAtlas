"use client";

import { useId, useRef } from "react";
import { Button } from "../components/button";
import { cn } from "../lib/cn";

const COVER_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export type OwnerInstitutionCoverFieldProps = {
  institutionName: string;
  coverImageUrl?: string;
  /** Upload progress percentage; null/undefined when idle. */
  progress?: number | null;
  error?: string;
  message?: string;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  className?: string;
};

/**
 * Cover preview + file picker for the owner profile form.
 * Upload/storage wiring is provided by the host app (no Firebase in UI package).
 */
export function OwnerInstitutionCoverField({
  institutionName,
  coverImageUrl,
  progress = null,
  error,
  message,
  disabled = false,
  onFileSelected,
  className,
}: OwnerInstitutionCoverFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = typeof progress === "number";

  return (
    <div className={cn("ea-owner-profile-cover", className)}>
      <div className="ea-owner-profile-cover__preview" aria-live="polite">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={`${institutionName} kapak fotoğrafı`}
            className="ea-owner-profile-cover__image"
          />
        ) : (
          <div
            className="ea-owner-profile-cover__placeholder"
            role="img"
            aria-label="Kapak fotoğrafı yok"
          >
            <span>Kapak fotoğrafı yok</span>
          </div>
        )}
      </div>

      <div className="ea-owner-profile-cover__actions">
        <input
          ref={inputRef}
          id={inputId}
          className="ea-owner-profile-cover__input"
          type="file"
          accept={COVER_ACCEPT}
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
          {uploading ? "Yükleniyor…" : "Kapak Fotoğrafını Değiştir"}
        </Button>
        <p className="ea-owner-profile-cover__hint">JPG, JPEG, PNG veya WEBP · en fazla 10 MB</p>
      </div>

      {uploading ? (
        <div
          className="ea-owner-profile-cover__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress ?? 0}
          aria-label="Kapak fotoğrafı yükleme ilerleme"
        >
          <div className="ea-owner-profile-cover__progress-track">
            <div
              className="ea-owner-profile-cover__progress-bar"
              style={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
            />
          </div>
          <span className="ea-owner-profile-cover__progress-label">{progress ?? 0}%</span>
        </div>
      ) : null}

      {error ? (
        <p
          className="ea-owner-profile-cover__status ea-owner-profile-cover__status--error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!error && message ? (
        <p
          className="ea-owner-profile-cover__status ea-owner-profile-cover__status--success"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
