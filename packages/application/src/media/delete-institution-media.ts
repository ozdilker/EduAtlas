import {
  createInstitutionId,
  createMediaAssetId,
  MediaType,
  MediaVariantKind,
} from "@eduatlas/domain";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { MediaNotFoundError } from "./errors";
import type { MediaRepository } from "./media-repository";
import type { ObjectStorage } from "./object-storage";
import { rebuildMediaAsset } from "./rebuild-media-asset";
import { syncInstitutionMediaUrls } from "./upload-institution-media";

export type DeleteInstitutionMediaInput = Readonly<{
  readonly institutionId: string;
  readonly mediaId: string;
  readonly deletedBy?: string;
  readonly now?: string;
}>;

export type DeleteInstitutionMediaDependencies = Readonly<{
  readonly mediaRepository: MediaRepository;
  readonly institutionRepository: InstitutionRepository;
  readonly objectStorage: ObjectStorage;
}>;

/**
 * Soft-deletes a media asset, removes storage bytes, and clears institution URL when needed.
 */
export async function deleteInstitutionMedia(
  input: DeleteInstitutionMediaInput,
  deps: DeleteInstitutionMediaDependencies,
): Promise<void> {
  const now = input.now ?? new Date().toISOString();
  const institutionId = createInstitutionId(input.institutionId);
  const institution = await deps.institutionRepository.getById(institutionId);
  if (!institution) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const mediaId = createMediaAssetId(input.mediaId);
  const asset = await deps.mediaRepository.getById(mediaId);

  if (!asset || asset.institutionId.value !== institutionId.value) {
    throw new MediaNotFoundError({ id: mediaId });
  }

  const original = asset.variants.find((item) => item.kind === MediaVariantKind.Original);
  if (original) {
    await deps.objectStorage.delete(original.storagePath);
  }

  await deps.mediaRepository.delete(mediaId);

  if (asset.type === MediaType.Logo || asset.type === MediaType.Cover) {
    await syncInstitutionMediaUrls(institution, asset.type, undefined, now, input.deletedBy, deps);
    return;
  }

  if (asset.isPrimary && asset.type === MediaType.Gallery) {
    const remaining = await deps.mediaRepository.listByInstitution({
      institutionId: input.institutionId,
      type: MediaType.Gallery,
    });
    const nextPrimary = remaining[0];
    if (nextPrimary) {
      await deps.mediaRepository.update(
        rebuildMediaAsset(nextPrimary, { isPrimary: true, updatedAt: now }),
      );
    }
  }
}
