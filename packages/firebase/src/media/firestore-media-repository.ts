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
  type MediaVariantKind,
  mediaAssetIdAsString,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";

export const INSTITUTION_MEDIA_COLLECTION = "institution_media";

type FirestoreMediaDocument = {
  institutionId: string;
  type: string;
  status: string;
  sortOrder: number;
  isPrimary: boolean;
  originalFileName: string;
  contentType: string;
  byteSize: number;
  altText?: string;
  variants: Array<{
    kind: string;
    storagePath: string;
    url: string;
    width?: number;
    height?: number;
    byteSize?: number;
    contentType?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
};

function toDomain(id: string, data: FirestoreMediaDocument): MediaAsset {
  return createMediaAsset({
    id,
    institutionId: data.institutionId,
    type: data.type,
    status: data.status,
    sortOrder: data.sortOrder,
    isPrimary: data.isPrimary,
    originalFileName: data.originalFileName,
    contentType: data.contentType,
    byteSize: data.byteSize,
    altText: data.altText,
    variants: data.variants.map((variant) => ({
      kind: variant.kind as MediaVariantKind,
      storagePath: variant.storagePath,
      url: variant.url,
      width: variant.width,
      height: variant.height,
      byteSize: variant.byteSize,
      contentType: variant.contentType,
    })),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdByUserId: data.createdByUserId,
  });
}

function toDocument(asset: MediaAsset): FirestoreMediaDocument {
  return {
    institutionId: asset.institutionId.value,
    type: asset.type,
    status: asset.status,
    sortOrder: asset.sortOrder,
    isPrimary: asset.isPrimary,
    originalFileName: asset.originalFileName,
    contentType: asset.contentType,
    byteSize: asset.byteSize,
    ...(asset.altText ? { altText: asset.altText } : {}),
    variants: asset.variants.map((variant) => ({
      kind: variant.kind,
      storagePath: variant.storagePath,
      url: variant.url,
      ...(variant.width !== undefined ? { width: variant.width } : {}),
      ...(variant.height !== undefined ? { height: variant.height } : {}),
      ...(variant.byteSize !== undefined ? { byteSize: variant.byteSize } : {}),
      ...(variant.contentType ? { contentType: variant.contentType } : {}),
    })),
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    ...(asset.createdByUserId ? { createdByUserId: asset.createdByUserId } : {}),
  };
}

/**
 * Firestore-backed MediaRepository for institution media metadata.
 */
export class FirestoreMediaRepository implements MediaRepository {
  constructor(private readonly firestore: Firestore) {}

  private collection() {
    return this.firestore.collection(INSTITUTION_MEDIA_COLLECTION);
  }

  async getById(id: MediaAssetId): Promise<MediaAsset | null> {
    const snap = await this.collection().doc(mediaAssetIdAsString(id)).get();
    if (!snap.exists) return null;
    return toDomain(snap.id, snap.data() as FirestoreMediaDocument);
  }

  async listByInstitution(input: {
    institutionId: string;
    type?: MediaType;
    includeDeleted?: boolean;
  }): Promise<readonly MediaAsset[]> {
    let query = this.collection().where("institutionId", "==", input.institutionId);
    if (input.type) {
      query = query.where("type", "==", input.type);
    }
    const snap = await query.get();
    const items = snap.docs
      .map((doc) => toDomain(doc.id, doc.data() as FirestoreMediaDocument))
      .filter((item) => input.includeDeleted || item.status !== MediaStatus.Deleted)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    return Object.freeze(items);
  }

  async save(asset: MediaAsset): Promise<MediaAsset> {
    const id = mediaAssetIdAsString(asset.id);
    const ref = this.collection().doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      throw new DuplicateMediaError({ id });
    }
    await ref.set(toDocument(asset));
    return asset;
  }

  async update(asset: MediaAsset): Promise<MediaAsset> {
    const id = mediaAssetIdAsString(asset.id);
    const ref = this.collection().doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      throw new MediaNotFoundError({ id });
    }
    await ref.set(toDocument(asset));
    return asset;
  }

  async delete(id: MediaAssetId): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new MediaNotFoundError({ id });
    }
    await this.update(
      createMediaAsset({
        id: mediaAssetIdAsString(id),
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

export function createFirestoreMediaRepository(firestore: Firestore): MediaRepository {
  return new FirestoreMediaRepository(firestore);
}
