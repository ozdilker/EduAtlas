import {
  createInstitutionId,
  createMediaAssetId,
  MediaType,
  mediaAssetPrimaryUrl,
} from "@eduatlas/domain";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { MediaNotFoundError, MediaValidationError } from "./errors";
import type { MediaRepository } from "./media-repository";
import { rebuildMediaAsset } from "./rebuild-media-asset";
import { syncInstitutionMediaUrls } from "./upload-institution-media";

export type SetPrimaryInstitutionMediaInput = Readonly<{
  readonly institutionId: string;
  readonly mediaId: string;
  readonly updatedBy?: string;
  readonly now?: string;
}>;

export type SetPrimaryInstitutionMediaDependencies = Readonly<{
  readonly mediaRepository: MediaRepository;
  readonly institutionRepository: InstitutionRepository;
}>;

/**
 * Marks one media asset as primary for its type; clears primary on siblings.
 * Logo/cover also write back to the Institution aggregate URLs.
 */
export async function setPrimaryInstitutionMedia(
  input: SetPrimaryInstitutionMediaInput,
  deps: SetPrimaryInstitutionMediaDependencies,
) {
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

  if (asset.status === "deleted") {
    throw new MediaValidationError("Silinmiş medya birincil yapılamaz.");
  }

  const siblings = await deps.mediaRepository.listByInstitution({
    institutionId: input.institutionId,
    type: asset.type,
  });

  for (const sibling of siblings) {
    const shouldBePrimary = sibling.id.value === asset.id.value;
    if (sibling.isPrimary !== shouldBePrimary) {
      await deps.mediaRepository.update(
        rebuildMediaAsset(sibling, { isPrimary: shouldBePrimary, updatedAt: now }),
      );
    }
  }

  const updated = rebuildMediaAsset(asset, { isPrimary: true, updatedAt: now });
  await deps.mediaRepository.update(updated);

  if (asset.type === MediaType.Logo || asset.type === MediaType.Cover) {
    await syncInstitutionMediaUrls(
      institution,
      asset.type,
      mediaAssetPrimaryUrl(asset),
      now,
      input.updatedBy,
      deps,
    );
  }

  return updated;
}
