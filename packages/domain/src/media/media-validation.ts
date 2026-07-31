import type { MediaType } from "./media-type";
import { MediaType as MediaTypeEnum } from "./media-type";

/** SECURITY-ARCHITECTURE §9 — image allowlist for logo/gallery. */
export const MEDIA_ALLOWED_CONTENT_TYPES: readonly string[] = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Per-image max size (bytes) — 5MB. */
export const MEDIA_MAX_BYTE_SIZE = 5 * 1024 * 1024;

/** Slot count limits (free tier default). */
export const MEDIA_MAX_COUNT: Readonly<Record<MediaType, number>> = Object.freeze({
  [MediaTypeEnum.Logo]: 1,
  [MediaTypeEnum.Cover]: 1,
  [MediaTypeEnum.Gallery]: 20,
});

export type MediaUploadValidation = Readonly<{
  readonly ok: boolean;
  readonly errors: readonly string[];
}>;

/**
 * Validates upload metadata against foundation media policy (no magic-byte/re-encode yet).
 */
export function validateMediaUpload(input: {
  contentType: string;
  byteSize: number;
  type: MediaType;
  currentCountForType: number;
}): MediaUploadValidation {
  const errors: string[] = [];
  const contentType = input.contentType.trim().toLowerCase();

  if (!MEDIA_ALLOWED_CONTENT_TYPES.includes(contentType)) {
    errors.push(
      `İzin verilmeyen biçim: ${contentType || "(boş)"}. İzin verilenler: JPEG, PNG, WebP.`,
    );
  }

  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0) {
    errors.push("Dosya boyutu geçersiz.");
  } else if (input.byteSize > MEDIA_MAX_BYTE_SIZE) {
    errors.push(`Dosya en fazla ${MEDIA_MAX_BYTE_SIZE / (1024 * 1024)} MB olabilir.`);
  }

  const max = MEDIA_MAX_COUNT[input.type];
  if (input.currentCountForType >= max) {
    errors.push(
      input.type === MediaTypeEnum.Gallery
        ? `Galeri en fazla ${max} görsel içerebilir.`
        : `Bu tür için en fazla ${max} görsel yüklenebilir.`,
    );
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
  });
}

export function mediaExtensionForContentType(contentType: string): string {
  switch (contentType.trim().toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
