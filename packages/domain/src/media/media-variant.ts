/**
 * Derived image sizes for delivery.
 * Foundation stores an Original; future Functions may fill smaller variants.
 */
export enum MediaVariantKind {
  Original = "original",
  Thumb = "thumb",
  Medium = "medium",
  Large = "large",
}

export type MediaVariant = Readonly<{
  readonly kind: MediaVariantKind;
  readonly storagePath: string;
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly byteSize?: number;
  readonly contentType?: string;
}>;

export type CreateMediaVariantInput = {
  kind: MediaVariantKind;
  storagePath: string;
  url: string;
  width?: number;
  height?: number;
  byteSize?: number;
  contentType?: string;
};

export function createMediaVariant(input: CreateMediaVariantInput): MediaVariant {
  const storagePath = input.storagePath.trim();
  const url = input.url.trim();
  const contentType = input.contentType?.trim();

  if (!storagePath) {
    throw new Error("MediaVariant.storagePath is required.");
  }
  if (!url) {
    throw new Error("MediaVariant.url is required.");
  }
  if (input.byteSize !== undefined && (!Number.isInteger(input.byteSize) || input.byteSize < 0)) {
    throw new Error("MediaVariant.byteSize must be an integer >= 0.");
  }

  return Object.freeze({
    kind: input.kind,
    storagePath,
    url,
    ...(input.width !== undefined ? { width: input.width } : {}),
    ...(input.height !== undefined ? { height: input.height } : {}),
    ...(input.byteSize !== undefined ? { byteSize: input.byteSize } : {}),
    ...(contentType ? { contentType } : {}),
  });
}

export function getOriginalVariant(variants: readonly MediaVariant[]): MediaVariant | null {
  return variants.find((item) => item.kind === MediaVariantKind.Original) ?? null;
}
