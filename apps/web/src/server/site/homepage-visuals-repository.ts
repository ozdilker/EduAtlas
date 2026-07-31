import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { HomepageVisualsRepository } from "@eduatlas/application";
import {
  getFirebaseServerEnv,
  isFirebaseAdminCertConfigured,
  shouldUseFirebaseEmulators,
} from "@eduatlas/config";
import type { HomepageVisuals } from "@eduatlas/domain";
import {
  createEmptyHomepageVisuals,
  createHomepageVisuals,
  isHomepageCitySlug,
} from "@eduatlas/domain";
import {
  createFirestoreHomepageVisualsRepository,
  createLocalFilesystemHomepageVisualsRepository,
  getAdminFirestore,
} from "@eduatlas/firebase/server";

let homepageVisualsRepositoryPromise: Promise<HomepageVisualsRepository> | undefined;

function canUseFirebaseBackend(): boolean {
  const env = getFirebaseServerEnv();
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return false;
  }
  if (shouldUseFirebaseEmulators(env)) {
    return true;
  }
  return isFirebaseAdminCertConfigured(env) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

function isQuotaOrUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "8" ||
    /RESOURCE_EXHAUSTED|Quota exceeded|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(`${code} ${message}`)
  );
}

function localVisualsFilePath(): string {
  return path.join(process.cwd(), "public", "media", "marketing", "homepage-visuals.json");
}

function createLocalRepository(): HomepageVisualsRepository {
  return createLocalFilesystemHomepageVisualsRepository(localVisualsFilePath());
}

function preferLocalVisuals(): boolean {
  const flag = process.env.EDUATLAS_LOCAL_HOMEPAGE_VISUALS?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

/**
 * Firestore primary + local JSON fallback (and dual-write) so uploads still work
 * when Storage is local or Firestore quota is exhausted.
 */
function createFallbackHomepageVisualsRepository(
  primary: HomepageVisualsRepository,
  fallback: HomepageVisualsRepository,
): HomepageVisualsRepository {
  let usingFallback = false;

  return {
    async get() {
      if (usingFallback) {
        return fallback.get();
      }
      try {
        const remote = await primary.get();
        const local = await fallback.get();
        return mergeHomepageVisuals(remote, local);
      } catch (error) {
        if (!isQuotaOrUnavailableError(error)) {
          throw error;
        }
        usingFallback = true;
        console.warn(
          "[eduatlas] Homepage visuals get() fell back to local JSON:",
          error instanceof Error ? error.message : error,
        );
        return fallback.get();
      }
    },
    async save(visuals) {
      // Always persist locally so city hero URLs survive Firestore quota outages.
      await fallback.save(visuals).catch((error) => {
        console.warn(
          "[eduatlas] Local homepage visuals save failed:",
          error instanceof Error ? error.message : error,
        );
      });

      if (usingFallback) {
        return fallback.save(visuals);
      }
      try {
        return await primary.save(visuals);
      } catch (error) {
        if (!isQuotaOrUnavailableError(error)) {
          throw error;
        }
        usingFallback = true;
        console.warn(
          "[eduatlas] Homepage visuals save() fell back to local JSON:",
          error instanceof Error ? error.message : error,
        );
        return fallback.save(visuals);
      }
    },
  };
}

function mergeHomepageVisuals(remote: HomepageVisuals, local: HomepageVisuals): HomepageVisuals {
  const cityImages: Record<string, { imageUrl?: string; storagePath?: string }> = {};
  for (const [slug, visual] of Object.entries(local.cityImages)) {
    if (visual) {
      cityImages[slug] = { ...visual };
    }
  }
  for (const [slug, visual] of Object.entries(remote.cityImages)) {
    if (visual?.imageUrl?.trim()) {
      cityImages[slug] = { ...visual };
    }
  }

  const heroImageUrl = remote.heroImageUrl?.trim() || local.heroImageUrl;
  const heroStoragePath = remote.heroStoragePath?.trim() || local.heroStoragePath;
  const updatedAt =
    remote.updatedAt && local.updatedAt
      ? remote.updatedAt > local.updatedAt
        ? remote.updatedAt
        : local.updatedAt
      : remote.updatedAt || local.updatedAt || new Date(0).toISOString();

  return createHomepageVisuals({
    heroImageUrl,
    heroStoragePath,
    cityImages,
    updatedAt,
    updatedByUserId: remote.updatedByUserId ?? local.updatedByUserId,
  });
}

/**
 * Discovers uploaded city/hero images under public/media when JSON metadata is empty.
 */
export async function discoverLocalHomepageVisualUrls(): Promise<{
  heroImageUrl?: string;
  cityImageUrls: Partial<Record<string, string>>;
}> {
  const root = path.join(process.cwd(), "public", "media", "marketing", "homepage");
  const cityImageUrls: Partial<Record<string, string>> = {};
  let heroImageUrl: string | undefined;

  try {
    const heroDir = path.join(root, "hero");
    const heroFile = await newestImageInDir(heroDir);
    if (heroFile) {
      heroImageUrl = `/media/marketing/homepage/hero/${heroFile}`;
    }
  } catch {
    // no hero folder
  }

  try {
    const citiesRoot = path.join(root, "cities");
    const cityDirs = await readdir(citiesRoot, { withFileTypes: true });
    for (const entry of cityDirs) {
      if (!entry.isDirectory() || !isHomepageCitySlug(entry.name)) {
        continue;
      }
      const file = await newestImageInDir(path.join(citiesRoot, entry.name));
      if (file) {
        cityImageUrls[entry.name] = `/media/marketing/homepage/cities/${entry.name}/${file}`;
      }
    }
  } catch {
    // no cities folder
  }

  return { heroImageUrl, cityImageUrls };
}

async function newestImageInDir(dir: string): Promise<string | null> {
  const entries = await readdir(dir);
  const images = entries.filter((name) => /\.(jpe?g|png|webp)$/i.test(name));
  if (images.length === 0) {
    return null;
  }
  const ranked = await Promise.all(
    images.map(async (name) => {
      const info = await stat(path.join(dir, name));
      return { name, mtime: info.mtimeMs };
    }),
  );
  ranked.sort((a, b) => b.mtime - a.mtime);
  return ranked[0]?.name ?? null;
}

/**
 * Homepage visuals settings — Firestore when configured, otherwise local JSON.
 * Always dual-writes local JSON; falls back on quota.
 */
export function getHomepageVisualsRepository(): Promise<HomepageVisualsRepository> {
  if (!homepageVisualsRepositoryPromise) {
    if (preferLocalVisuals() || !canUseFirebaseBackend()) {
      homepageVisualsRepositoryPromise = Promise.resolve(createLocalRepository());
    } else {
      homepageVisualsRepositoryPromise = Promise.resolve(
        createFallbackHomepageVisualsRepository(
          createFirestoreHomepageVisualsRepository(getAdminFirestore()),
          createLocalRepository(),
        ),
      );
    }
  }
  return homepageVisualsRepositoryPromise;
}

export function resetHomepageVisualsRepositoryForTests(): void {
  homepageVisualsRepositoryPromise = undefined;
}

export function emptyHomepageVisualsForTests(): HomepageVisuals {
  return createEmptyHomepageVisuals();
}
