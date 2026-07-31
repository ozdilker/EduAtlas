import {
  createDraftInstitution,
  type Institution,
  type InstitutionId,
  institutionIdAsString,
  type MediaAsset,
  type MediaAssetId,
  MediaStatus,
  MediaType,
  mediaAssetIdAsString,
} from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  createInstitutionPage,
  DuplicateInstitutionError,
  InstitutionNotFoundError,
  type InstitutionRepository,
} from "../institutions";
import { deleteInstitutionMedia } from "./delete-institution-media";
import { DuplicateMediaError, MediaNotFoundError, MediaValidationError } from "./errors";
import { createInstitutionMediaRepository } from "./institution-media-repository";
import { getInstitutionMediaSnapshot } from "./list-institution-media";
import type { MediaRepository } from "./media-repository";
import type { ObjectStorage } from "./object-storage";
import { reorderInstitutionMedia } from "./reorder-institution-media";
import { setPrimaryInstitutionMedia } from "./set-primary-institution-media";
import { uploadInstitutionMedia } from "./upload-institution-media";

const NOW = "2026-07-15T16:00:00.000Z";

class InMemoryObjectStorage implements ObjectStorage {
  readonly objects = new Map<string, { data: Uint8Array; contentType: string }>();

  async put(input: { path: string; contentType: string; data: Uint8Array }) {
    this.objects.set(input.path, { data: input.data, contentType: input.contentType });
    return { path: input.path, url: `memory://${input.path}` };
  }

  async delete(path: string) {
    this.objects.delete(path);
  }

  async getUrl(path: string) {
    return `memory://${path}`;
  }
}

class InMemoryMediaRepository implements MediaRepository {
  private readonly byId = new Map<string, MediaAsset>();

  async getById(id: MediaAssetId) {
    return this.byId.get(mediaAssetIdAsString(id)) ?? null;
  }

  async listByInstitution(input: {
    institutionId: string;
    type?: MediaType;
    includeDeleted?: boolean;
  }) {
    return [...this.byId.values()].filter((item) => {
      if (item.institutionId.value !== input.institutionId) return false;
      if (!input.includeDeleted && item.status === MediaStatus.Deleted) return false;
      if (input.type && item.type !== input.type) return false;
      return true;
    });
  }

  async save(asset: MediaAsset) {
    const id = mediaAssetIdAsString(asset.id);
    if (this.byId.has(id)) throw new DuplicateMediaError({ id });
    this.byId.set(id, asset);
    return asset;
  }

  async update(asset: MediaAsset) {
    const id = mediaAssetIdAsString(asset.id);
    if (!this.byId.has(id)) throw new MediaNotFoundError({ id });
    this.byId.set(id, asset);
    return asset;
  }

  async delete(id: MediaAssetId) {
    const key = mediaAssetIdAsString(id);
    const existing = this.byId.get(key);
    if (!existing) throw new MediaNotFoundError({ id });
    this.byId.set(key, {
      ...existing,
      status: MediaStatus.Deleted,
      isPrimary: false,
    } as MediaAsset);
  }
}

class InMemoryInstitutionRepository implements InstitutionRepository {
  private readonly byId = new Map<string, Institution>();

  constructor(seed: Institution) {
    this.byId.set(institutionIdAsString(seed.id), seed);
  }

  async getById(id: InstitutionId) {
    return this.byId.get(institutionIdAsString(id)) ?? null;
  }
  async getBySlug(slug: string) {
    return [...this.byId.values()].find((item) => item.slug === slug) ?? null;
  }
  async list() {
    const items = [...this.byId.values()];
    return createInstitutionPage({
      items,
      page: 1,
      pageSize: items.length || 1,
      totalItems: items.length,
    });
  }
  async save(institution: Institution) {
    const id = institutionIdAsString(institution.id);
    if (this.byId.has(id)) throw new DuplicateInstitutionError({ id });
    this.byId.set(id, institution);
    return institution;
  }
  async update(institution: Institution) {
    const id = institutionIdAsString(institution.id);
    if (!this.byId.has(id)) throw new InstitutionNotFoundError({ id });
    this.byId.set(id, institution);
    return institution;
  }
  async delete(id: InstitutionId) {
    this.byId.delete(institutionIdAsString(id));
  }
}

function pngBytes(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
}

function seedInstitution(): Institution {
  return createDraftInstitution({
    id: "inst_media",
    name: "Medya Kurumu",
    slug: "medya-kurumu",
    primaryType: "kindergarten",
    location: { cityId: "city_a", districtId: "dist_a", address: "Adres" },
    shortDescription: "Açıklama",
    contact: { phone: "+90 212 000 00 00" },
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe("institution media operations", () => {
  it("uploads logo, syncs institution logoUrl, and rejects invalid format", async () => {
    const mediaRepository = new InMemoryMediaRepository();
    const institutionRepository = new InMemoryInstitutionRepository(seedInstitution());
    const objectStorage = new InMemoryObjectStorage();
    const deps = { mediaRepository, institutionRepository, objectStorage };

    const logo = await uploadInstitutionMedia(
      {
        institutionId: "inst_media",
        type: MediaType.Logo,
        fileName: "logo.png",
        contentType: "image/png",
        data: pngBytes(),
        uploadedBy: "owner_demo",
        now: NOW,
      },
      deps,
    );

    expect(logo.isPrimary).toBe(true);
    expect(objectStorage.objects.size).toBe(1);

    const institution = await institutionRepository.getById({ value: "inst_media" });
    expect(institution?.logoUrl).toContain("institutions/inst_media/logo/");

    await expect(
      uploadInstitutionMedia(
        {
          institutionId: "inst_media",
          type: MediaType.Gallery,
          fileName: "x.svg",
          contentType: "image/svg+xml",
          data: pngBytes(),
          now: NOW,
        },
        deps,
      ),
    ).rejects.toBeInstanceOf(MediaValidationError);
  });

  it("lists snapshot, sets primary gallery image, reorders, and deletes", async () => {
    const mediaRepository = new InMemoryMediaRepository();
    const institutionRepository = new InMemoryInstitutionRepository(seedInstitution());
    const objectStorage = new InMemoryObjectStorage();
    const deps = { mediaRepository, institutionRepository, objectStorage };

    const first = await uploadInstitutionMedia(
      {
        institutionId: "inst_media",
        type: MediaType.Gallery,
        fileName: "a.jpg",
        contentType: "image/jpeg",
        data: pngBytes(),
        now: NOW,
      },
      deps,
    );
    const second = await uploadInstitutionMedia(
      {
        institutionId: "inst_media",
        type: MediaType.Gallery,
        fileName: "b.jpg",
        contentType: "image/jpeg",
        data: pngBytes(),
        now: NOW,
      },
      deps,
    );

    expect(first.isPrimary).toBe(true);
    expect(second.isPrimary).toBe(false);

    await setPrimaryInstitutionMedia(
      { institutionId: "inst_media", mediaId: second.id.value, now: NOW },
      deps,
    );

    const institutionMedia = createInstitutionMediaRepository(mediaRepository);
    const primary = await institutionMedia.getPrimary("inst_media", MediaType.Gallery);
    expect(primary?.id.value).toBe(second.id.value);

    await reorderInstitutionMedia(
      {
        institutionId: "inst_media",
        orderedMediaIds: [second.id.value, first.id.value],
        now: NOW,
      },
      deps,
    );

    const snapshot = await getInstitutionMediaSnapshot("inst_media", { mediaRepository });
    expect(snapshot.gallery.map((item) => item.id.value)).toEqual([
      second.id.value,
      first.id.value,
    ]);

    await deleteInstitutionMedia(
      { institutionId: "inst_media", mediaId: second.id.value, now: NOW },
      deps,
    );

    const afterDelete = await getInstitutionMediaSnapshot("inst_media", { mediaRepository });
    expect(afterDelete.gallery).toHaveLength(1);
    expect(afterDelete.gallery[0]?.isPrimary).toBe(true);
  });
});
