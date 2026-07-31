"use client";

import { useState } from "react";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import { parsePromoVideoPreview } from "./promo-video-preview";

export type OwnerPromoVideoFieldProps = {
  defaultValue?: string;
  className?: string;
};

/**
 * Promo video URL field with live YouTube / Vimeo embed preview (no upload).
 */
export function OwnerPromoVideoField({ defaultValue = "", className }: OwnerPromoVideoFieldProps) {
  const [url, setUrl] = useState(defaultValue);
  const preview = parsePromoVideoPreview(url);

  return (
    <div className={cn("ea-owner-profile-video", className)}>
      <p className="ea-owner-profile-form__section-text">
        YouTube veya Vimeo video linki girin. Dosya yükleme desteklenmez.
      </p>
      <div className="ea-owner-profile-form__field">
        <label className="ea-owner-profile-form__label" htmlFor="owner-profile-promo-video">
          Video URL
        </label>
        <Input
          id="owner-profile-promo-video"
          name="promoVideoUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=… veya https://vimeo.com/…"
        />
      </div>
      {preview ? (
        <div className="ea-owner-profile-video__preview">
          <p className="ea-owner-profile-video__provider">
            Önizleme · {preview.provider === "youtube" ? "YouTube" : "Vimeo"}
          </p>
          <div className="ea-owner-profile-video__frame">
            <iframe
              title="Tanıtım videosu önizleme"
              src={preview.embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      ) : url.trim() ? (
        <p className="ea-owner-profile-video__hint" role="status">
          Geçerli bir YouTube veya Vimeo video URL’si girildiğinde önizleme görünür.
        </p>
      ) : null}
    </div>
  );
}
