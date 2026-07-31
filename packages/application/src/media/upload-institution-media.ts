import {
  createInstitution,
  createInstitutionId,
  createMediaAsset,
  type Institution,
  institutionIdAsString,
  MediaStatus,
  MediaType,
  MediaVariantKind,
  mediaExtensionForContentType,
  parseMediaType,
  validateMediaUpload,
} from "@eduatlas/domain";
import { InstitutionNotFoundError } from "../institutions/errors";
import type { InstitutionRepository } from "../institutions/institution-repository";
import { withRecalculatedInstitutionQuality } from "../institution-quality/with-recalculated-institution-quality";
import { MediaValidationError } from "./errors";
import type { MediaRepository } from "./media-repository";
import type { ObjectStorage } from "./object-storage";
import { rebuildMediaAsset } from "./rebuild-media-asset";

export type UploadInstitutionMediaInput = Readonly<{
  readonly institutionId: string;
  readonly type: MediaType | string;
  readonly fileName: string;
  readonly contentType: string;
  readonly data: Uint8Array;
  readonly altText?: string;
  readonly setAsPrimary?: boolean;
  readonly uploadedBy?: string;
  readonly now?: string;
}>;

export type UploadInstitutionMediaDependencies = Readonly<{
  readonly mediaRepository: MediaRepository;
  readonly institutionRepository: InstitutionRepository;
  readonly objectStorage: ObjectStorage;
}>;

/**
 * Validates, stores bytes via ObjectStorage, and persists a MediaAsset.
 * Logo/cover slots replace the previous asset when the slot is full.
 */
export async function uploadInstitutionMedia(
  input: UploadInstitutionMediaInput,
  deps: UploadInstitutionMediaDependencies,
) {
  const type = typeof input.type === "string" ? parseMediaType(input.type) : input.type;
  const now = input.now ?? new Date().toISOString();
  const institutionId = createInstitutionId(input.institutionId);

  const existingInstitution = await deps.institutionRepository.getById(institutionId);
  if (!existingInstitution) {
    throw new InstitutionNotFoundError({ id: institutionId });
  }

  const institutionIdValue = institutionIdAsString(institutionId);
  const existing = await deps.mediaRepository.listByInstitution({
    institutionId: institutionIdValue,
    type,
  });
  let currentCount = existing.length;

  if ((type === MediaType.Logo || type === MediaType.Cover) && existing.length >= 1) {
    for (const asset of existing) {
      await deps.mediaRepository.delete(asset.id);
      const original = asset.variants.find((item) => item.kind === MediaVariantKind.Original);
      if (original) {
        await deps.objectStorage.delete(original.storagePath);
      }
    }
    currentCount = 0;
  }

  const validation = validateMediaUpload({
    contentType: input.contentType,
    byteSize: input.data.byteLength,
    type,
    currentCountForType: currentCount,
  });

  if (!validation.ok) {
    throw new MediaValidationError("Medya yükleme doğrulaması başarısız.", validation.errors);
  }

  const assetId = `media_${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const extension = mediaExtensionForContentType(input.contentType);
  const storagePath = `institutions/${institutionIdValue}/${type}/${assetId}.${extension}`;

  const put = await deps.objectStorage.put({
    path: storagePath,
    contentType: input.contentType,
    data: input.data,
    publicReadable: true,
  });

  const makePrimary =
    input.setAsPrimary ??
    (type === MediaType.Logo || type === MediaType.Cover || existing.length === 0);

  const sortOrder =
    type === MediaType.Gallery
      ? existing.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1
      : 0;

  if (makePrimary && type === MediaType.Gallery) {
    for (const item of existing.filter((asset) => asset.isPrimary)) {
      await deps.mediaRepository.update(
        rebuildMediaAsset(item, { isPrimary: false, updatedAt: now }),
      );
    }
  }

  const saved = await deps.mediaRepository.save(
    createMediaAsset({
      id: assetId,
      institutionId: institutionIdValue,
      type,
      status: MediaStatus.Ready,
      sortOrder,
      isPrimary: makePrimary,
      originalFileName: input.fileName,
      contentType: input.contentType,
      byteSize: input.data.byteLength,
      altText: input.altText,
      variants: [
        {
          kind: MediaVariantKind.Original,
          storagePath: put.path,
          url: put.url,
          byteSize: input.data.byteLength,
          contentType: input.contentType,
        },
      ],
      createdAt: now,
      updatedAt: now,
      createdByUserId: input.uploadedBy,
    }),
  );

  if (makePrimary && (type === MediaType.Logo || type === MediaType.Cover)) {
    await syncInstitutionMediaUrls(existingInstitution, type, put.url, now, input.uploadedBy, deps);
  }

  return saved;
}

export async function syncInstitutionMediaUrls(
  institution: Institution,
  type: MediaType,
  url: string | undefined,
  now: string,
  updatedBy: string | undefined,
  deps: { institutionRepository: InstitutionRepository },
): Promise<void> {
  const next = createInstitution({
    id: institutionIdAsString(institution.id),
    name: institution.name,
    slug: institution.slug,
    primaryType: institution.primaryType,
    status: institution.status,
    verification: institution.verification,
    location: institution.location,
    contact: institution.contact,
    socialLinks: institution.socialLinks,
    shortDescription: institution.shortDescription,
    longDescription: institution.longDescription,
    programsSummary: institution.programsSummary,
    ageOrLevelFocus: institution.ageOrLevelFocus,
    logoUrl: type === MediaType.Logo ? url : institution.logoUrl,
    coverImageUrl: type === MediaType.Cover ? url : institution.coverImageUrl,
    galleryImages: institution.galleryImages,
    workingHours: institution.workingHours,
    promoVideoUrl: institution.promoVideoUrl,
    brochurePdfUrl: institution.brochurePdfUrl,
    amenities: institution.amenities,
    educationPrograms: institution.educationPrograms,
    faqs: institution.faqs,
      highlights: institution.highlights,
    isPremium: institution.isPremium,
    qualityScore: institution.qualityScore,
    publishedAt: institution.publishedAt,
    createdAt: institution.createdAt,
    updatedAt: now,
    updatedByUserId: updatedBy ?? institution.updatedByUserId,
  });

  await deps.institutionRepository.update(withRecalculatedInstitutionQuality(next, now));
}
