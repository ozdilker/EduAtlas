import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { HomepageVisualsRepository } from "@eduatlas/application";
import {
  createEmptyHomepageVisuals,
  createHomepageVisuals,
  isHomepageCitySlug,
  type HomepageVisuals,
} from "@eduatlas/domain";

type PersistedCityVisual = {
  imageUrl?: string;
  storagePath?: string;
};

type PersistedHomepageVisuals = {
  heroImageUrl?: string;
  heroStoragePath?: string;
  cityImages?: Record<string, PersistedCityVisual>;
  updatedAt: string;
  updatedByUserId?: string;
};

function fromPersisted(data: PersistedHomepageVisuals | null): HomepageVisuals {
  if (!data) {
    return createEmptyHomepageVisuals();
  }

  const cityImages: Partial<Record<string, { imageUrl?: string; storagePath?: string }>> = {};
  for (const [cityId, visual] of Object.entries(data.cityImages ?? {})) {
    if (!isHomepageCitySlug(cityId) || !visual) {
      continue;
    }
    cityImages[cityId] = {
      ...(visual.imageUrl ? { imageUrl: visual.imageUrl } : {}),
      ...(visual.storagePath ? { storagePath: visual.storagePath } : {}),
    };
  }

  return createHomepageVisuals({
    heroImageUrl: data.heroImageUrl,
    heroStoragePath: data.heroStoragePath,
    cityImages,
    updatedAt: data.updatedAt,
    updatedByUserId: data.updatedByUserId,
  });
}

function toPersisted(visuals: HomepageVisuals): PersistedHomepageVisuals {
  const cityImages: Record<string, PersistedCityVisual> = {};
  for (const [cityId, visual] of Object.entries(visuals.cityImages)) {
    if (!visual) {
      continue;
    }
    cityImages[cityId] = {
      ...(visual.imageUrl ? { imageUrl: visual.imageUrl } : {}),
      ...(visual.storagePath ? { storagePath: visual.storagePath } : {}),
    };
  }

  return {
    ...(visuals.heroImageUrl ? { heroImageUrl: visuals.heroImageUrl } : {}),
    ...(visuals.heroStoragePath ? { heroStoragePath: visuals.heroStoragePath } : {}),
    cityImages,
    updatedAt: visuals.updatedAt,
    ...(visuals.updatedByUserId ? { updatedByUserId: visuals.updatedByUserId } : {}),
  };
}

/**
 * File-backed homepage visuals for local/dev when Firestore is unavailable.
 */
export class LocalFilesystemHomepageVisualsRepository implements HomepageVisualsRepository {
  constructor(private readonly filePath: string) {}

  async get(): Promise<HomepageVisuals> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return fromPersisted(JSON.parse(raw) as PersistedHomepageVisuals);
    } catch {
      return createEmptyHomepageVisuals();
    }
  }

  async save(visuals: HomepageVisuals): Promise<HomepageVisuals> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(toPersisted(visuals), null, 2)}\n`, "utf8");
    return visuals;
  }
}

export function createLocalFilesystemHomepageVisualsRepository(
  filePath: string,
): HomepageVisualsRepository {
  return new LocalFilesystemHomepageVisualsRepository(filePath);
}
