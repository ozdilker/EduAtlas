import type { InstitutionStorageFolder } from "./types";

const INSTITUTIONS_ROOT = "institutions";
const USERS_ROOT = "users";
const NEWS_ROOT = "news";
const IMAGE_VARIANT_THUMB_200 = "thumb_200";
const IMAGE_VARIANT_SMALL_400 = "small_400";
const IMAGE_VARIANT_MEDIUM_800 = "medium_800";
const IMAGE_VARIANT_LARGE_1200 = "large_1200";

export type InstitutionImageVariant =
  | typeof IMAGE_VARIANT_THUMB_200
  | typeof IMAGE_VARIANT_SMALL_400
  | typeof IMAGE_VARIANT_MEDIUM_800
  | typeof IMAGE_VARIANT_LARGE_1200;

function trimSegment(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required for Storage path.`);
  }
  if (trimmed.includes("/") || trimmed.includes("..")) {
    throw new Error(`${label} must be a single path segment.`);
  }
  return trimmed;
}

function joinPath(...segments: string[]): string {
  return segments.map((segment) => segment.replace(/^\/+|\/+$/g, "")).join("/");
}

/**
 * Central Storage path builder — keep all object path conventions here.
 */
export const storagePaths = {
  /**
   * `institutions/{institutionId}/{folder}`
   */
  institutionDirectory(institutionId: string, folder: InstitutionStorageFolder): string {
    return joinPath(
      INSTITUTIONS_ROOT,
      trimSegment(institutionId, "institutionId"),
      trimSegment(folder, "folder"),
    );
  },

  /**
   * `institutions/{institutionId}/{folder}/{fileName}`
   */
  institutionObject(
    institutionId: string,
    folder: InstitutionStorageFolder,
    fileName: string,
  ): string {
    return joinPath(
      storagePaths.institutionDirectory(institutionId, folder),
      trimSegment(fileName, "fileName"),
    );
  },

  /**
   * `institutions/{institutionId}/{folder}/{variant}/{fileName}`
   *
   * Variants are generated from the original upload by a resize pipeline
   * (e.g. Cloud Functions triggered on Storage upload).
   */
  institutionImageVariantDirectory(
    institutionId: string,
    folder: InstitutionStorageFolder,
    variant: InstitutionImageVariant,
  ): string {
    return joinPath(
      storagePaths.institutionDirectory(institutionId, folder),
      trimSegment(variant, "variant"),
    );
  },

  institutionImageVariantObject(
    institutionId: string,
    folder: InstitutionStorageFolder,
    variant: InstitutionImageVariant,
    fileName: string,
  ): string {
    return joinPath(
      storagePaths.institutionImageVariantDirectory(institutionId, folder, variant),
      trimSegment(fileName, "fileName"),
    );
  },

  institutionLogo(institutionId: string): string {
    return storagePaths.institutionDirectory(institutionId, "logo");
  },

  institutionCover(institutionId: string): string {
    return storagePaths.institutionDirectory(institutionId, "cover");
  },

  institutionGallery(institutionId: string): string {
    return storagePaths.institutionDirectory(institutionId, "gallery");
  },

  institutionDocuments(institutionId: string): string {
    return storagePaths.institutionDirectory(institutionId, "documents");
  },

  institutionVideos(institutionId: string): string {
    return storagePaths.institutionDirectory(institutionId, "videos");
  },

  /**
   * `users/{userId}/profile`
   */
  userProfile(userId: string): string {
    return joinPath(USERS_ROOT, trimSegment(userId, "userId"), "profile");
  },

  /**
   * `news/{newsId}/images`
   */
  newsImages(newsId: string): string {
    return joinPath(NEWS_ROOT, trimSegment(newsId, "newsId"), "images");
  },
} as const;

export type StoragePaths = typeof storagePaths;
