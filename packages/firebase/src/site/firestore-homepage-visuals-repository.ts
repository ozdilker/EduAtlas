import type { HomepageVisualsRepository } from "@eduatlas/application";
import {
  createEmptyHomepageVisuals,
  createHomepageVisuals,
  isHomepageCitySlug,
  type HomepageVisuals,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { CACHE_TTL_MS, TtlCache } from "../cache";
import { countFirestoreRead, countFirestoreWrite } from "../monitoring/firestore-counter";

export const SITE_SETTINGS_COLLECTION = "site_settings";
export const HOMEPAGE_VISUALS_DOC_ID = "homepage_visuals";

type FirestoreCityVisual = {
  imageUrl?: string;
  storagePath?: string;
};

type FirestoreHomepageVisualsDocument = {
  heroImageUrl?: string;
  heroStoragePath?: string;
  cityImages?: Record<string, FirestoreCityVisual>;
  updatedAt: string;
  updatedByUserId?: string;
};

function fromDocument(data: FirestoreHomepageVisualsDocument | undefined): HomepageVisuals {
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

function toDocument(visuals: HomepageVisuals): FirestoreHomepageVisualsDocument {
  const cityImages: Record<string, FirestoreCityVisual> = {};
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

export class FirestoreHomepageVisualsRepository implements HomepageVisualsRepository {
  private readonly cache = new TtlCache<HomepageVisuals>(CACHE_TTL_MS.settings);
  constructor(private readonly db: Firestore) {}

  private docRef() {
    return this.db.collection(SITE_SETTINGS_COLLECTION).doc(HOMEPAGE_VISUALS_DOC_ID);
  }

  async get(): Promise<HomepageVisuals> {
    return this.cache.getOrLoad("homepage_visuals", async () => {
      countFirestoreRead();
      const snap = await this.docRef().get();
      if (!snap.exists) {
        return createEmptyHomepageVisuals();
      }
      return fromDocument(snap.data() as FirestoreHomepageVisualsDocument);
    });
  }

  async save(visuals: HomepageVisuals): Promise<HomepageVisuals> {
    countFirestoreWrite();
    await this.docRef().set(toDocument(visuals), { merge: true });
    this.cache.clear();
    return visuals;
  }
}

export function createFirestoreHomepageVisualsRepository(
  db: Firestore,
): HomepageVisualsRepository {
  return new FirestoreHomepageVisualsRepository(db);
}

export class InMemoryHomepageVisualsRepository implements HomepageVisualsRepository {
  private current: HomepageVisuals = createEmptyHomepageVisuals();

  async get(): Promise<HomepageVisuals> {
    return this.current;
  }

  async save(visuals: HomepageVisuals): Promise<HomepageVisuals> {
    this.current = visuals;
    return this.current;
  }
}

export function createInMemoryHomepageVisualsRepository(): HomepageVisualsRepository {
  return new InMemoryHomepageVisualsRepository();
}
