import { createInstitutionId, type InstitutionId } from "../institution";
import { isActiveMediaStatus, MediaStatus, parseMediaStatus } from "./media-status";
import { type MediaType, parseMediaType } from "./media-type";
import {
  type CreateMediaVariantInput,
  createMediaVariant,
  getOriginalVariant,
  type MediaVariant,
} from "./media-variant";

/**
 * Opaque media asset identity.
 */
export type MediaAssetId = Readonly<{
  readonly value: string;
}>;

const MEDIA_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function createMediaAssetId(raw: string): MediaAssetId {
  const value = raw.trim();
  if (!MEDIA_ID_PATTERN.test(value)) {
    throw new Error("MediaAssetId must be 1–128 URL-safe characters.");
  }
  return Object.freeze({ value });
}

export function mediaAssetIdAsString(id: MediaAssetId): string {
  return id.value;
}

/**
 * Canonical institution media asset (logo, cover, or gallery item).
 */
export type MediaAsset = Readonly<{
  readonly id: MediaAssetId;
  readonly institutionId: InstitutionId;
  readonly type: MediaType;
  readonly status: MediaStatus;
  readonly sortOrder: number;
  readonly isPrimary: boolean;
  readonly originalFileName: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly altText?: string;
  readonly variants: readonly MediaVariant[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId?: string;
}>;

export type CreateMediaAssetInput = {
  id: string;
  institutionId: string;
  type: MediaType | string;
  status?: MediaStatus | string;
  sortOrder?: number;
  isPrimary?: boolean;
  originalFileName: string;
  contentType: string;
  byteSize: number;
  altText?: string;
  variants: readonly CreateMediaVariantInput[];
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
};

/**
 * Creates an immutable MediaAsset.
 */
export function createMediaAsset(input: CreateMediaAssetInput): MediaAsset {
  const originalFileName = input.originalFileName.trim();
  const contentType = input.contentType.trim().toLowerCase();
  const altText = input.altText?.trim();
  const createdByUserId = input.createdByUserId?.trim();
  const type = typeof input.type === "string" ? parseMediaType(input.type) : input.type;
  const status = input.status
    ? typeof input.status === "string"
      ? parseMediaStatus(input.status)
      : input.status
    : MediaStatus.Pending;
  const sortOrder = input.sortOrder ?? 0;

  if (!originalFileName) {
    throw new Error("MediaAsset.originalFileName is required.");
  }
  if (!contentType) {
    throw new Error("MediaAsset.contentType is required.");
  }
  if (!Number.isInteger(input.byteSize) || input.byteSize < 0) {
    throw new Error("MediaAsset.byteSize must be an integer >= 0.");
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("MediaAsset.sortOrder must be an integer >= 0.");
  }
  if (input.variants.length === 0) {
    throw new Error("MediaAsset.variants must include at least the original.");
  }
  assertIso(input.createdAt, "createdAt");
  assertIso(input.updatedAt, "updatedAt");

  const variants = Object.freeze(input.variants.map((item) => createMediaVariant(item)));
  if (!getOriginalVariant(variants)) {
    throw new Error("MediaAsset.variants must include an original variant.");
  }

  return Object.freeze({
    id: createMediaAssetId(input.id),
    institutionId: createInstitutionId(input.institutionId),
    type,
    status,
    sortOrder,
    isPrimary: Boolean(input.isPrimary),
    originalFileName,
    contentType,
    byteSize: input.byteSize,
    ...(altText ? { altText } : {}),
    variants,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    ...(createdByUserId ? { createdByUserId } : {}),
  });
}

export function mediaAssetPrimaryUrl(asset: MediaAsset): string {
  const original = getOriginalVariant(asset.variants);
  if (!original) {
    throw new Error("MediaAsset has no original variant.");
  }
  return original.url;
}

export function isVisibleMediaAsset(asset: MediaAsset): boolean {
  return isActiveMediaStatus(asset.status);
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`MediaAsset.${field} must be a valid ISO timestamp.`);
  }
}
