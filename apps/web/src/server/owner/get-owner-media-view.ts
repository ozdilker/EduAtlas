import { getInstitutionMediaSnapshot } from "@eduatlas/application";
import {
  createInstitutionId,
  MEDIA_ALLOWED_CONTENT_TYPES,
  MEDIA_MAX_BYTE_SIZE,
  MEDIA_MAX_COUNT,
  type MediaAsset,
  MediaType,
  mediaAssetPrimaryUrl,
} from "@eduatlas/domain";
import {
  formatMediaByteSize,
  type OwnerMediaAssetView,
  type OwnerMediaPageViewData,
} from "@eduatlas/ui";
import { getInstitutionRepository } from "../institutions/repository";
import { getMediaRepository } from "../media/repository";
import { requireOwnerContext } from "./require-owner-context";

export type OwnerMediaSearchParams = {
  notice?: string | string[];
  noticeTone?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toAssetView(asset: MediaAsset): OwnerMediaAssetView {
  return Object.freeze({
    id: asset.id.value,
    type: asset.type,
    fileName: asset.originalFileName,
    url: mediaAssetPrimaryUrl(asset),
    isPrimary: asset.isPrimary,
    sortOrder: asset.sortOrder,
    contentType: asset.contentType,
    byteSizeLabel: formatMediaByteSize(asset.byteSize),
  });
}

/**
 * Loads Owner Media page data via MediaRepository (no Storage SDK in UI).
 */
export async function getOwnerMediaView(
  searchParams: OwnerMediaSearchParams = {},
): Promise<OwnerMediaPageViewData | null> {
  const { institutionId } = await requireOwnerContext();
  const institutionRepository = await getInstitutionRepository();
  const mediaRepository = await getMediaRepository();

  const institution = await institutionRepository.getById(createInstitutionId(institutionId));
  if (!institution) {
    return null;
  }

  const snapshot = await getInstitutionMediaSnapshot(institutionId, { mediaRepository });
  const notice = firstParam(searchParams.notice)?.trim() ?? "";
  const noticeToneRaw = firstParam(searchParams.noticeTone)?.trim();

  return Object.freeze({
    institutionId,
    institutionName: institution.name,
    institutionLogoUrl: institution.logoUrl,
    logo: Object.freeze(snapshot.logo.map(toAssetView)),
    cover: Object.freeze(snapshot.cover.map(toAssetView)),
    gallery: Object.freeze(snapshot.gallery.map(toAssetView)),
    limits: Object.freeze({
      maxByteSizeMb: MEDIA_MAX_BYTE_SIZE / (1024 * 1024),
      allowedFormatsLabel: MEDIA_ALLOWED_CONTENT_TYPES.map((type) =>
        type.replace("image/", "").toUpperCase(),
      ).join(", "),
      maxGallery: MEDIA_MAX_COUNT[MediaType.Gallery],
    }),
    notice,
    noticeTone: noticeToneRaw === "error" ? "error" : notice ? "info" : "",
  });
}
