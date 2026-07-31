import type { MediaAsset, MediaAssetId, MediaType } from "@eduatlas/domain";

/**
 * Persistence port for MediaAsset metadata.
 */
export interface MediaRepository {
  getById(id: MediaAssetId): Promise<MediaAsset | null>;

  listByInstitution(input: {
    institutionId: string;
    type?: MediaType;
    includeDeleted?: boolean;
  }): Promise<readonly MediaAsset[]>;

  /**
   * Persists a new media asset.
   * @throws {DuplicateMediaError} when the id already exists
   */
  save(asset: MediaAsset): Promise<MediaAsset>;

  /**
   * Replaces an existing media asset.
   * @throws {MediaNotFoundError} when missing
   */
  update(asset: MediaAsset): Promise<MediaAsset>;

  /**
   * Soft-deletes (status=deleted) or hard-deletes per adapter policy.
   * @throws {MediaNotFoundError} when missing
   */
  delete(id: MediaAssetId): Promise<void>;
}
