import { type MediaAssetId, mediaAssetIdAsString } from "@eduatlas/domain";

export class MediaNotFoundError extends Error {
  readonly code = "MEDIA_NOT_FOUND" as const;
  readonly id?: string;

  constructor(lookup: { id?: MediaAssetId | string }) {
    const id =
      typeof lookup.id === "string"
        ? lookup.id
        : lookup.id
          ? mediaAssetIdAsString(lookup.id)
          : undefined;
    super(`Media asset not found (${id ? `id=${id}` : "unknown"}).`);
    this.name = "MediaNotFoundError";
    this.id = id;
  }
}

export class DuplicateMediaError extends Error {
  readonly code = "DUPLICATE_MEDIA" as const;
  readonly id?: string;

  constructor(conflict: { id?: MediaAssetId | string }) {
    const id =
      typeof conflict.id === "string"
        ? conflict.id
        : conflict.id
          ? mediaAssetIdAsString(conflict.id)
          : undefined;
    super(`Duplicate media asset (${id ? `id=${id}` : "unknown"}).`);
    this.name = "DuplicateMediaError";
    this.id = id;
  }
}

export class MediaValidationError extends Error {
  readonly code = "MEDIA_VALIDATION" as const;
  readonly errors: readonly string[];

  constructor(message: string, errors: readonly string[] = []) {
    super(message);
    this.name = "MediaValidationError";
    this.errors = Object.freeze([...errors]);
  }
}

export function isMediaNotFoundError(error: unknown): error is MediaNotFoundError {
  return error instanceof MediaNotFoundError;
}

export function isDuplicateMediaError(error: unknown): error is DuplicateMediaError {
  return error instanceof DuplicateMediaError;
}

export function isMediaValidationError(error: unknown): error is MediaValidationError {
  return error instanceof MediaValidationError;
}
