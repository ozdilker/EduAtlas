import { createInstitutionId, MediaType } from "@eduatlas/domain";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { MediaValidationError } from "./errors";
import type { MediaRepository } from "./media-repository";
import { rebuildMediaAsset } from "./rebuild-media-asset";

export type ReorderInstitutionMediaInput = Readonly<{
  readonly institutionId: string;
  /** Ordered media ids (typically gallery). */
  readonly orderedMediaIds: readonly string[];
  readonly type?: MediaType;
  readonly updatedBy?: string;
  readonly now?: string;
}>;

export type ReorderInstitutionMediaDependencies = Readonly<{
  readonly mediaRepository: MediaRepository;
  readonly institutionRepository: InstitutionRepository;
}>;

/**
 * Applies a new sortOrder sequence for institution media of a given type (default: gallery).
 */
export async function reorderInstitutionMedia(
  input: ReorderInstitutionMediaInput,
  deps: ReorderInstitutionMediaDependencies,
): Promise<void> {
  const now = input.now ?? new Date().toISOString();
  const type = input.type ?? MediaType.Gallery;
  const institutionId = createInstitutionId(input.institutionId);

  if (!(await deps.institutionRepository.getById(institutionId))) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  if (input.orderedMediaIds.length === 0) {
    throw new MediaValidationError("Sıralama listesi boş olamaz.");
  }

  const existing = await deps.mediaRepository.listByInstitution({
    institutionId: input.institutionId,
    type,
  });
  const byId = new Map(existing.map((item) => [item.id.value, item]));

  if (input.orderedMediaIds.length !== existing.length) {
    throw new MediaValidationError("Sıralama listesi mevcut galeri öğeleriyle eşleşmiyor.");
  }

  for (const id of input.orderedMediaIds) {
    if (!byId.has(id)) {
      throw new MediaValidationError(`Bilinmeyen medya kimliği: ${id}`);
    }
  }

  await Promise.all(
    input.orderedMediaIds.map((id, index) => {
      const asset = byId.get(id);
      if (!asset || asset.sortOrder === index) {
        return Promise.resolve();
      }
      return deps.mediaRepository.update(
        rebuildMediaAsset(asset, { sortOrder: index, updatedAt: now }),
      );
    }),
  );
}
