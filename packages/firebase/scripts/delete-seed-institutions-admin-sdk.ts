/**
 * Deletes dummy seed institutions (`seed_inst_*`) via Firebase Admin SDK.
 *
 * Usage (from repo root):
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/delete-seed-institutions-admin-sdk.ts
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/delete-seed-institutions-admin-sdk.ts --dry-run
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { INSTITUTIONS_COLLECTION } from "../src/institutions/firestore-institution-document";
import { INSTITUTION_SEED_DATASET } from "../src/seeds/institution-seeds";

const dryRun = process.argv.includes("--dry-run");

function initAdmin() {
  if (getApps().length > 0) {
    return;
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replaceAll("\\n", "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY",
    );
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

async function main(): Promise<void> {
  const ids = INSTITUTION_SEED_DATASET.map((seed) => seed.id);
  console.log(
    `[eduatlas] ${dryRun ? "Dry-run: would delete" : "Deleting"} ${ids.length} seed institutions`,
  );

  if (dryRun) {
    for (const id of ids) {
      console.log(`  - ${id}`);
    }
    return;
  }

  initAdmin();
  const db = getFirestore();
  let deleted = 0;
  for (const id of ids) {
    await db.collection(INSTITUTIONS_COLLECTION).doc(id).delete();
    deleted += 1;
    console.log(`  deleted ${id}`);
  }
  console.log(`[eduatlas] Done. Removed ${deleted} seed documents.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
