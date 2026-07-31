export type OwnerMediaSlot = "logo" | "cover" | "gallery";

export type OwnerMediaAssetView = Readonly<{
  readonly id: string;
  readonly type: OwnerMediaSlot;
  readonly fileName: string;
  readonly url: string;
  readonly isPrimary: boolean;
  readonly sortOrder: number;
  readonly contentType: string;
  readonly byteSizeLabel: string;
}>;

export type OwnerMediaPageViewData = Readonly<{
  readonly institutionId: string;
  readonly institutionName: string;
  readonly institutionLogoUrl?: string;
  readonly logo: readonly OwnerMediaAssetView[];
  readonly cover: readonly OwnerMediaAssetView[];
  readonly gallery: readonly OwnerMediaAssetView[];
  readonly limits: Readonly<{
    readonly maxByteSizeMb: number;
    readonly allowedFormatsLabel: string;
    readonly maxGallery: number;
  }>;
  readonly notice: string;
  readonly noticeTone: "info" | "error" | "";
}>;

export type OwnerMediaFormState = Readonly<{
  readonly ok: boolean;
  readonly message: string;
}>;

export const OWNER_MEDIA_INITIAL_STATE: OwnerMediaFormState = Object.freeze({
  ok: false,
  message: "",
});

export function formatMediaByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
