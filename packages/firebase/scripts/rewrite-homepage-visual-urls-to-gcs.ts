/**
 * Rewrites homepage visual URLs from firebasestorage token URLs to public GCS URLs.
 *
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/rewrite-homepage-visual-urls-to-gcs.ts
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HOMEPAGE_VISUALS_DOC_ID } from "../src/site/firestore-homepage-visuals-repository";

const SITE_SETTINGS_COLLECTION = "site_settings";
const bucket =
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET ??
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
  "eduatlas-dev-media";

function toGcsUrl(storagePath: string): string {
  const encoded = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://storage.googleapis.com/${bucket}/${encoded}`;
}

function rewriteUrl(url: string | undefined, storagePath: string | undefined): string | undefined {
  if (storagePath?.trim()) {
    return toGcsUrl(storagePath.trim());
  }
  if (!url?.trim()) return undefined;
  if (url.includes("storage.googleapis.com/")) return url.trim();
  if (url.startsWith("/media/")) {
    return toGcsUrl(url.replace(/^\/media\//, ""));
  }
  // firebasestorage.googleapis.com/.../o/ENCODED?alt=media&token=...
  const match = url.match(/\/o\/([^?]+)/);
  if (match?.[1]) {
    return toGcsUrl(decodeURIComponent(match[1]));
  }
  return url.trim();
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replaceAll("\\n", "\n"),
    }),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });
}

const db = getFirestore();
const ref = db.collection(SITE_SETTINGS_COLLECTION).doc(HOMEPAGE_VISUALS_DOC_ID);
const snap = await ref.get();
if (!snap.exists) throw new Error("homepage_visuals missing");

const raw = snap.data() as {
  heroImageUrl?: string;
  heroStoragePath?: string;
  cityImages?: Record<string, { imageUrl?: string; storagePath?: string }>;
  updatedAt?: string;
  updatedByUserId?: string;
};

const cityImages: Record<string, { imageUrl?: string; storagePath?: string }> = {};
for (const [slug, visual] of Object.entries(raw.cityImages ?? {})) {
  const imageUrl = rewriteUrl(visual?.imageUrl, visual?.storagePath);
  cityImages[slug] = {
    ...(imageUrl ? { imageUrl } : {}),
    ...(visual?.storagePath ? { storagePath: visual.storagePath } : {}),
  };
}

const next = {
  heroImageUrl: rewriteUrl(raw.heroImageUrl, raw.heroStoragePath),
  heroStoragePath: raw.heroStoragePath,
  cityImages,
  updatedAt: new Date().toISOString(),
  updatedByUserId: raw.updatedByUserId,
};

await ref.set(
  {
    ...(next.heroImageUrl ? { heroImageUrl: next.heroImageUrl } : {}),
    ...(next.heroStoragePath ? { heroStoragePath: next.heroStoragePath } : {}),
    cityImages: next.cityImages,
    updatedAt: next.updatedAt,
    ...(next.updatedByUserId ? { updatedByUserId: next.updatedByUserId } : {}),
  },
  { merge: false },
);

console.log("Rewrote homepage_visuals to GCS URLs");
console.log("hero:", next.heroImageUrl);
console.log("cities:", Object.keys(cityImages).join(", "));
