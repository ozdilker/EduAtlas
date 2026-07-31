import {
  createMediaAsset,
  institutionIdAsString,
  type MediaAsset,
  mediaAssetIdAsString,
} from "@eduatlas/domain";

/**
 * Rebuilds a MediaAsset with selective field overrides (immutable update helper).
 */
export function rebuildMediaAsset(
  asset: MediaAsset,
  patch: {
    status?: MediaAsset["status"];
    sortOrder?: number;
    isPrimary?: boolean;
    updatedAt: string;
    altText?: string;
  },
): MediaAsset {
  return createMediaAsset({
    id: mediaAssetIdAsString(asset.id),
    institutionId: institutionIdAsString(asset.institutionId),
    type: asset.type,
    status: patch.status ?? asset.status,
    sortOrder: patch.sortOrder ?? asset.sortOrder,
    isPrimary: patch.isPrimary ?? asset.isPrimary,
    originalFileName: asset.originalFileName,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    altText: patch.altText ?? asset.altText,
    variants: asset.variants,
    createdAt: asset.createdAt,
    updatedAt: patch.updatedAt,
    createdByUserId: asset.createdByUserId,
  });
}
