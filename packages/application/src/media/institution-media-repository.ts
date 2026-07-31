import type { MediaAsset, MediaType } from "@eduatlas/domain";

/**
 * Institution-scoped media façade over MediaRepository.
 * Keeps owner/admin use cases institution-centric.
 */
export interface InstitutionMediaRepository {
  list(institutionId: string, type?: MediaType): Promise<readonly MediaAsset[]>;

  getPrimary(institutionId: string, type: MediaType): Promise<MediaAsset | null>;
}

/**
 * Default InstitutionMediaRepository backed by MediaRepository.
 */
export function createInstitutionMediaRepository(mediaRepository: {
  listByInstitution(input: {
    institutionId: string;
    type?: MediaType;
    includeDeleted?: boolean;
  }): Promise<readonly MediaAsset[]>;
}): InstitutionMediaRepository {
  return {
    async list(institutionId, type) {
      const items = await mediaRepository.listByInstitution({
        institutionId,
        ...(type ? { type } : {}),
      });
      return Object.freeze([...items].sort((left, right) => left.sortOrder - right.sortOrder));
    },

    async getPrimary(institutionId, type) {
      const items = await this.list(institutionId, type);
      return items.find((item) => item.isPrimary) ?? items[0] ?? null;
    },
  };
}
