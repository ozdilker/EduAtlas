/**
 * Ensures the Firebase Storage default bucket exists for Admin uploads.
 * Run: node scripts/ensure-storage-bucket.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, "apps/web/.env.local");
const envText = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const projectId = env.FIREBASE_ADMIN_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket =
  env.FIREBASE_ADMIN_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");

if (!projectId || !storageBucket || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin / Storage env vars.");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
    storageBucket,
  });
}

const storage = getStorage();
const bucket = storage.bucket(storageBucket);
const [exists] = await bucket.exists();

console.log({ projectId, storageBucket, exists });

if (exists) {
  console.log("Bucket already exists.");
  process.exit(0);
}

console.log("Creating bucket...");
try {
  await storage.bucket().create({
    // Prefer same region family as Firestore (eur3).
    location: "EUROPE-WEST3",
    storageClass: "STANDARD",
    iamConfiguration: {
      uniformBucketLevelAccess: { enabled: true },
    },
  });
  console.log("Created via default bucket().");
} catch (error) {
  console.log("Default create failed:", error?.message || error);
  console.log("Trying explicit createBucket...");
  const [created] = await storage.bucket(storageBucket).create({
    location: "EUROPE-WEST3",
    storageClass: "STANDARD",
    iamConfiguration: {
      uniformBucketLevelAccess: { enabled: true },
    },
  });
  console.log("Created:", created?.name || storageBucket);
}

const [existsAfter] = await storage.bucket(storageBucket).exists();
console.log({ existsAfter });
