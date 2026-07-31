import {
  DuplicateMediaError,
  MediaNotFoundError,
  type MediaRepository,
} from "@eduatlas/application";
import {
  createMediaAsset,
  type MediaAsset,
  type MediaAssetId,
  MediaStatus,
  type MediaType,
  mediaAssetIdAsString,
} from "@eduatlas/domain";

/**
 * In-memory MediaRepository for local/CI.
 */
export class InMemoryMediaRepository implements MediaRepository {
  private readonly byId = new Map<string, MediaAsset>();

  async getById(id: MediaAssetId): Promise<MediaAsset | null> {
    return this.byId.get(mediaAssetIdAsString(id)) ?? null;
  }

  async listByInstitution(input: {
    institutionId: string;
    type?: MediaType;
    includeDeleted?: boolean;
  }): Promise<readonly MediaAsset[]> {
    return Object.freeze(
      [...this.byId.values()]
        .filter((item) => {
          if (item.institutionId.value !== input.institutionId) return false;
          if (!input.includeDeleted && item.status === MediaStatus.Deleted) return false;
          if (input.type && item.type !== input.type) return false;
          return true;
        })
        .sort((left, right) => left.sortOrder - right.sortOrder),
    );
  }

  async save(asset: MediaAsset): Promise<MediaAsset> {
    const id = mediaAssetIdAsString(asset.id);
    if (this.byId.has(id)) {
      throw new DuplicateMediaError({ id });
    }
    this.byId.set(id, asset);
    return asset;
  }

  async update(asset: MediaAsset): Promise<MediaAsset> {
    const id = mediaAssetIdAsString(asset.id);
    if (!this.byId.has(id)) {
      throw new MediaNotFoundError({ id });
    }
    this.byId.set(id, asset);
    return asset;
  }

  async delete(id: MediaAssetId): Promise<void> {
    const key = mediaAssetIdAsString(id);
    const existing = this.byId.get(key);
    if (!existing) {
      throw new MediaNotFoundError({ id });
    }
    this.byId.set(
      key,
      createMediaAsset({
        id: key,
        institutionId: existing.institutionId.value,
        type: existing.type,
        status: MediaStatus.Deleted,
        sortOrder: existing.sortOrder,
        isPrimary: false,
        originalFileName: existing.originalFileName,
        contentType: existing.contentType,
        byteSize: existing.byteSize,
        altText: existing.altText,
        variants: existing.variants,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
        createdByUserId: existing.createdByUserId,
      }),
    );
  }
}

export function createInMemoryMediaRepository(): MediaRepository {
  return new InMemoryMediaRepository();
}
