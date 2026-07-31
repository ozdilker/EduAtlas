/**
 * Deletes dummy seed institutions (`seed_inst_*`) from Cloud Firestore.
 * Uses the Firebase CLI OAuth access token (same approach as seed-dev-firestore-admin).
 *
 * Usage:
 *   npx tsx packages/firebase/scripts/delete-seed-institutions-admin.ts
 *   npx tsx packages/firebase/scripts/delete-seed-institutions-admin.ts --dry-run
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { INSTITUTIONS_COLLECTION } from "../src/institutions/firestore-institution-document";
import { INSTITUTION_SEED_DATASET } from "../src/seeds/institution-seeds";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "eduatlas-dev";
const dryRun = process.argv.includes("--dry-run");

function readFirebaseCliAccessToken(): string {
  const configPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
  const raw = fs.readFileSync(configPath, "utf8");
  const match = raw.match(/"access_token"\s*:\s*"([^"]+)"/);
  if (!match?.[1]) {
    throw new Error("Firebase CLI access_token not found. Run: npx firebase-tools login");
  }
  return match[1];
}

async function deleteInstitution(token: string, id: string): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${INSTITUTIONS_COLLECTION}/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to delete ${id}: ${response.status} ${text}`);
  }
}

async function main(): Promise<void> {
  const ids = INSTITUTION_SEED_DATASET.map((seed) => seed.id);
  console.log(
    `[eduatlas] ${dryRun ? "Dry-run: would delete" : "Deleting"} ${ids.length} seed institutions from ${PROJECT_ID}`,
  );

  if (dryRun) {
    for (const id of ids) {
      console.log(`  - ${id}`);
    }
    return;
  }

  const token = readFirebaseCliAccessToken();
  let deleted = 0;
  for (const id of ids) {
    await deleteInstitution(token, id);
    deleted += 1;
    console.log(`  deleted ${id}`);
  }
  console.log(`[eduatlas] Done. Removed ${deleted} seed documents.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
