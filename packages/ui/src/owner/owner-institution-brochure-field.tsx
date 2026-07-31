"use client";

import { useId, useRef } from "react";
import { Button } from "../components/button";
import { cn } from "../lib/cn";

const PDF_ACCEPT = "application/pdf,.pdf";

export type OwnerInstitutionBrochureFieldProps = {
  brochurePdfUrl?: string;
  /** Upload progress percentage; null/undefined when idle. */
  progress?: number | null;
  error?: string;
  message?: string;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  onDelete?: () => void;
  className?: string;
};

/**
 * Brochure PDF preview actions for the owner profile form.
 * Upload/storage wiring is provided by the host app (no Firebase in UI package).
 */
export function OwnerInstitutionBrochureField({
  brochurePdfUrl,
  progress = null,
  error,
  message,
  disabled = false,
  onFileSelected,
  onDelete,
  className,
}: OwnerInstitutionBrochureFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = typeof progress === "number";
  const busy = disabled || uploading;

  return (
    <div className={cn("ea-owner-profile-brochure", className)}>
      <p className="ea-owner-profile-form__section-text">
        Kurum broşürünü PDF olarak yükleyin. En fazla 20 MB.
      </p>

      <div className="ea-owner-profile-brochure__preview" aria-live="polite">
        {brochurePdfUrl ? (
          <a
            className="ea-owner-profile-brochure__link"
            href={brochurePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mevcut broşürü aç (PDF)
          </a>
        ) : (
          <div className="ea-owner-profile-brochure__placeholder" role="status">
            Broşür yüklenmedi
          </div>
        )}
      </div>

      <div className="ea-owner-profile-brochure__actions">
        <input
          ref={inputRef}
          id={inputId}
          className="ea-owner-profile-brochure__input"
          type="file"
          accept={PDF_ACCEPT}
          disabled={busy}
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
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Yükleniyor…" : brochurePdfUrl ? "PDF Değiştir" : "PDF Yükle"}
        </Button>
        {brochurePdfUrl && onDelete ? (
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onDelete}>
            Sil
          </Button>
        ) : null}
        <p className="ea-owner-profile-brochure__hint">Yalnızca PDF · en fazla 20 MB</p>
      </div>

      {uploading ? (
        <div
          className="ea-owner-profile-brochure__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress ?? 0}
          aria-label="Broşür yükleme ilerleme"
        >
          <div className="ea-owner-profile-brochure__progress-track">
            <div
              className="ea-owner-profile-brochure__progress-bar"
              style={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
            />
          </div>
          <span className="ea-owner-profile-brochure__progress-label">{progress ?? 0}%</span>
        </div>
      ) : null}

      {error ? (
        <p
          className="ea-owner-profile-brochure__status ea-owner-profile-brochure__status--error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!error && message ? (
        <p
          className="ea-owner-profile-brochure__status ea-owner-profile-brochure__status--success"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
