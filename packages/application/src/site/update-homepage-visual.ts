import {
  createEmptyHomepageVisuals,
  createHomepageVisuals,
  isHomepageCitySlug,
  isHomepageVisualSlot,
  type HomepageVisuals,
  type HomepageVisualSlot,
} from "@eduatlas/domain";
import type { ObjectStorage } from "../media/object-storage";
import type { HomepageVisualsRepository } from "./homepage-visuals-repository";

export type GetHomepageVisualsDependencies = Readonly<{
  readonly homepageVisualsRepository: HomepageVisualsRepository;
}>;

export async function getHomepageVisuals(
  deps: GetHomepageVisualsDependencies,
): Promise<HomepageVisuals> {
  return deps.homepageVisualsRepository.get();
}

export type UpdateHomepageVisualInput = Readonly<{
  readonly slot: HomepageVisualSlot;
  readonly fileName: string;
  readonly contentType: string;
  readonly data: Uint8Array;
  readonly updatedByUserId?: string;
  readonly now?: string;
}>;

export type UpdateHomepageVisualDependencies = Readonly<{
  readonly homepageVisualsRepository: HomepageVisualsRepository;
  readonly objectStorage: ObjectStorage;
  /** When provided, city slots must resolve to a known geography city. */
  readonly assertCitySlug?: (slug: string) => Promise<boolean>;
}>;

export class HomepageVisualValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HomepageVisualValidationError";
  }
}

export function isHomepageVisualValidationError(
  error: unknown,
): error is HomepageVisualValidationError {
  return error instanceof HomepageVisualValidationError;
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Browsers (esp. Windows) often send an empty File.type — infer from extension.
 */
export function resolveImageContentType(contentType: string, fileName: string): string {
  const trimmed = contentType.trim().toLowerCase();
  if (ALLOWED_TYPES.has(trimmed)) {
    return trimmed;
  }
  const match = fileName.toLowerCase().match(/\.(jpe?g|png|webp)$/);
  const ext = match?.[1];
  if (ext === "png") {
    return "image/png";
  }
  if (ext === "webp") {
    return "image/webp";
  }
  if (ext === "jpg" || ext === "jpeg") {
    return "image/jpeg";
  }
  return trimmed;
}

function sanitizeFileName(fileName: string): string {
  const base = fileName.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return base.length > 0 ? base.slice(0, 80) : "image.jpg";
}

function extensionFor(contentType: string, fileName: string): string {
  if (contentType === "image/png") {
    return "png";
  }
  if (contentType === "image/webp") {
    return "webp";
  }
  if (contentType === "image/jpeg") {
    return "jpg";
  }
  const match = fileName.toLowerCase().match(/\.(jpe?g|png|webp)$/);
  return match?.[1]?.replace("jpeg", "jpg") ?? "jpg";
}

function buildStoragePath(slot: string, fileName: string, contentType: string): string {
  const stamp = Date.now();
  const safe = sanitizeFileName(fileName);
  const ext = extensionFor(contentType, safe);
  if (slot === "hero") {
    return `marketing/homepage/hero/${stamp}-${safe.replace(/\.[^.]+$/, "")}.${ext}`;
  }
  return `marketing/homepage/cities/${slot}/${stamp}-${safe.replace(/\.[^.]+$/, "")}.${ext}`;
}

/**
 * Uploads a homepage visual slot and persists the new URL.
 * Deletes the previous object when a storage path was recorded.
 */
export async function updateHomepageVisual(
  input: UpdateHomepageVisualInput,
  deps: UpdateHomepageVisualDependencies,
): Promise<HomepageVisuals> {
  const slot = input.slot.trim();
  if (!isHomepageVisualSlot(slot)) {
    throw new HomepageVisualValidationError("Geçersiz görsel alanı.");
  }

  if (slot !== "hero") {
    if (!isHomepageCitySlug(slot)) {
      throw new HomepageVisualValidationError("Geçersiz şehir alanı.");
    }
    if (deps.assertCitySlug) {
      const known = await deps.assertCitySlug(slot);
      if (!known) {
        throw new HomepageVisualValidationError("Şehir bulunamadı.");
      }
    }
  }

  const contentType = resolveImageContentType(input.contentType, input.fileName);
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new HomepageVisualValidationError("Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz.");
  }
  if (input.data.byteLength <= 0) {
    throw new HomepageVisualValidationError("Lütfen bir görsel seçin.");
  }
  if (input.data.byteLength > MAX_BYTES) {
    throw new HomepageVisualValidationError("Görsel en fazla 10 MB olabilir.");
  }

  const current = await deps.homepageVisualsRepository.get();
  const storagePath = buildStoragePath(slot, input.fileName, contentType);
  const uploaded = await deps.objectStorage.put({
    path: storagePath,
    contentType,
    data: input.data,
    publicReadable: true,
  });

  const now = input.now ?? new Date().toISOString();
  let previousPath: string | undefined;
  let next: HomepageVisuals;

  if (slot === "hero") {
    previousPath = current.heroStoragePath;
    next = createHomepageVisuals({
      heroImageUrl: uploaded.url,
      heroStoragePath: uploaded.path,
      cityImages: current.cityImages,
      updatedAt: now,
      updatedByUserId: input.updatedByUserId,
    });
  } else {
    previousPath = current.cityImages[slot]?.storagePath;
    next = createHomepageVisuals({
      heroImageUrl: current.heroImageUrl,
      heroStoragePath: current.heroStoragePath,
      cityImages: {
        ...current.cityImages,
        [slot]: {
          imageUrl: uploaded.url,
          storagePath: uploaded.path,
        },
      },
      updatedAt: now,
      updatedByUserId: input.updatedByUserId,
    });
  }

  try {
    const saved = await deps.homepageVisualsRepository.save(next);
    if (previousPath && previousPath !== uploaded.path) {
      await deps.objectStorage.delete(previousPath).catch(() => undefined);
    }
    return saved;
  } catch (error) {
    await deps.objectStorage.delete(uploaded.path).catch(() => undefined);
    throw error;
  }
}

export function emptyHomepageVisualsFallback(): HomepageVisuals {
  return createEmptyHomepageVisuals();
}
