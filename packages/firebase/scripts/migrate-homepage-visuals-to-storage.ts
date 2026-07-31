/**
 * Migrates homepage visuals from local public/media URLs to Firebase Storage.
 *
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/migrate-homepage-visuals-to-storage.ts
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/migrate-homepage-visuals-to-storage.ts --dry-run
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  createHomepageVisuals,
  type HomepageCityVisual,
  type HomepageVisuals,
} from "@eduatlas/domain";
import { HOMEPAGE_VISUALS_DOC_ID } from "../src/site/firestore-homepage-visuals-repository";
import { createFirebaseAdminObjectStorage } from "../src/media/firebase-admin-object-storage";

const dryRun = process.argv.includes("--dry-run");
const SITE_SETTINGS_COLLECTION = "site_settings";

function initAdmin() {
  if (getApps().length > 0) return;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replaceAll("\\n", "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials");
  }
  const bucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
    ...(bucket ? { storageBucket: bucket } : {}),
  });
}

function contentTypeFor(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function isLocalMediaUrl(url: string | undefined): boolean {
  return Boolean(url?.trim().startsWith("/media/"));
}

function localFileFromUrl(url: string): string {
  // /media/... → apps/web/public/media/...
  const relative = url.replace(/^\/media\//, "");
  return path.join(process.cwd(), "apps", "web", "public", "media", relative);
}

async function migrateAsset(
  storage: ReturnType<typeof createFirebaseAdminObjectStorage>,
  storagePath: string | undefined,
  imageUrl: string | undefined,
  label: string,
): Promise<{ imageUrl?: string; storagePath?: string } | null> {
  if (!imageUrl && !storagePath) return null;
  if (!isLocalMediaUrl(imageUrl) && imageUrl?.startsWith("https://")) {
    console.log(`  skip ${label} (already remote)`);
    return { imageUrl, storagePath };
  }

  const pathForUpload = storagePath?.trim() || imageUrl!.replace(/^\/media\//, "");
  const localPath = localFileFromUrl(imageUrl?.startsWith("/media/") ? imageUrl : `/media/${pathForUpload}`);

  console.log(`  ${dryRun ? "would upload" : "upload"} ${label}: ${localPath} → ${pathForUpload}`);
  if (dryRun) {
    return { imageUrl: `https://(firebase)/${pathForUpload}`, storagePath: pathForUpload };
  }

  const data = await readFile(localPath);
  const uploaded = await storage.put({
    path: pathForUpload,
    contentType: contentTypeFor(localPath),
    data,
    publicReadable: true,
  });
  console.log(`    → ${uploaded.url}`);
  return { imageUrl: uploaded.url, storagePath: uploaded.path };
}

async function main() {
  initAdmin();
  const db = getFirestore();
  const bucketName =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName?.trim()) {
    throw new Error("FIREBASE_ADMIN_STORAGE_BUCKET / NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET missing");
  }

  const [exists] = await getStorage().bucket(bucketName).exists();
  if (!exists) {
    throw new Error(`Storage bucket "${bucketName}" does not exist`);
  }

  const ref = db.collection(SITE_SETTINGS_COLLECTION).doc(HOMEPAGE_VISUALS_DOC_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("homepage_visuals document not found");
  }

  const raw = snap.data() as {
    heroImageUrl?: string;
    heroStoragePath?: string;
    cityImages?: Record<string, HomepageCityVisual>;
    updatedAt?: string;
    updatedByUserId?: string;
  };

  console.log(`[eduatlas] Migrating homepage visuals${dryRun ? " (dry-run)" : ""}…`);
  const storage = createFirebaseAdminObjectStorage(getStorage(), bucketName);

  const hero = await migrateAsset(storage, raw.heroStoragePath, raw.heroImageUrl, "hero");
  const cityImages: Record<string, HomepageCityVisual> = {};
  for (const [slug, visual] of Object.entries(raw.cityImages ?? {})) {
    const migrated = await migrateAsset(storage, visual?.storagePath, visual?.imageUrl, slug);
    if (migrated?.imageUrl) {
      cityImages[slug] = {
        imageUrl: migrated.imageUrl,
        ...(migrated.storagePath ? { storagePath: migrated.storagePath } : {}),
      };
    }
  }

  const next: HomepageVisuals = createHomepageVisuals({
    heroImageUrl: hero?.imageUrl,
    heroStoragePath: hero?.storagePath,
    cityImages,
    updatedAt: new Date().toISOString(),
    updatedByUserId: raw.updatedByUserId,
  });

  if (dryRun) {
    console.log("[eduatlas] Dry-run result:", JSON.stringify(next, null, 2));
    return;
  }

  await ref.set(
    {
      ...(next.heroImageUrl ? { heroImageUrl: next.heroImageUrl } : {}),
      ...(next.heroStoragePath ? { heroStoragePath: next.heroStoragePath } : {}),
      cityImages: Object.fromEntries(
        Object.entries(next.cityImages).map(([slug, visual]) => [
          slug,
          {
            ...(visual?.imageUrl ? { imageUrl: visual.imageUrl } : {}),
            ...(visual?.storagePath ? { storagePath: visual.storagePath } : {}),
          },
        ]),
      ),
      updatedAt: next.updatedAt,
      ...(next.updatedByUserId ? { updatedByUserId: next.updatedByUserId } : {}),
    },
    { merge: false },
  );

  console.log("[eduatlas] Firestore homepage_visuals updated.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
