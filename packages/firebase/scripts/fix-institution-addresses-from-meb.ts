/**
 * Re-applies MEB `ADRES` onto existing Firestore institution docs.
 * Fixes imports where `MERNIS_ADRES_KODU` overwrote the real address.
 *
 * Usage (repo root):
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/fix-institution-addresses-from-meb.ts
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/fix-institution-addresses-from-meb.ts --dry-run
 */
import { readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveImportSlug } from "@eduatlas/domain";
import {
  importInstitutionId,
  normalizeInstitutionImportRows,
  parseImportFile,
} from "@eduatlas/application";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { INSTITUTIONS_COLLECTION } from "../src/institutions/firestore-institution-document";

const dryRun = process.argv.includes("--dry-run");

function initAdmin() {
  if (getApps().length > 0) {
    return;
  }
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

function findLatestMebUpload(): { fileName: string; content: Uint8Array } {
  const dir = join(tmpdir(), "eduatlas-import-uploads");
  const bins = readdirSync(dir)
    .filter((name) => name.endsWith(".bin"))
    .map((name) => join(dir, name));
  if (bins.length === 0) {
    throw new Error(`No cached MEB upload in ${dir}. Preview an Excel once in /admin/import.`);
  }
  bins.sort();
  const path = bins.at(-1)!;
  const metaPath = path.replace(/\.bin$/, ".json");
  let fileName = "meb.xlsx";
  try {
    const meta = JSON.parse(readFileSync(metaPath, "utf8")) as { fileName?: string };
    if (meta.fileName) {
      fileName = meta.fileName;
    }
  } catch {
    // ignore
  }
  return { fileName, content: new Uint8Array(readFileSync(path)) };
}

function looksLikeMernisCode(value: string): boolean {
  return /^\d{7,}$/.test(value.trim());
}

async function main() {
  initAdmin();
  const db = getFirestore();
  const upload = findLatestMebUpload();
  const parsed = await parseImportFile(upload);
  const normalized = normalizeInstitutionImportRows(parsed.rows);

  const addressByDocId = new Map<string, string>();
  let skippedEmpty = 0;
  let skippedNumeric = 0;
  for (const row of normalized) {
    const address = row.address.trim();
    if (!address) {
      skippedEmpty += 1;
      continue;
    }
    if (looksLikeMernisCode(address)) {
      skippedNumeric += 1;
      continue;
    }
    const id = importInstitutionId(resolveImportSlug(row));
    addressByDocId.set(id, address);
  }

  console.log(
    `Mapped ${addressByDocId.size} addresses (skipped empty=${skippedEmpty}, still-numeric=${skippedNumeric}, dryRun=${dryRun})`,
  );

  let updated = 0;
  let missing = 0;
  let unchanged = 0;
  let alreadyGood = 0;
  const entries = [...addressByDocId.entries()];

  for (let offset = 0; offset < entries.length; offset += 400) {
    const chunk = entries.slice(offset, offset + 400);
    const refs = chunk.map(([id]) => db.collection(INSTITUTIONS_COLLECTION).doc(id));
    const snaps = await db.getAll(...refs);
    const batch = db.batch();
    let batchWrites = 0;

    for (let index = 0; index < chunk.length; index += 1) {
      const [id, nextAddress] = chunk[index]!;
      const snap = snaps[index];
      if (!snap?.exists) {
        missing += 1;
        continue;
      }
      const current = String(snap.data()?.address ?? "").trim();
      if (current === nextAddress) {
        unchanged += 1;
        if (!looksLikeMernisCode(current)) {
          alreadyGood += 1;
        }
        continue;
      }
      updated += 1;
      if (!dryRun) {
        batch.update(snap.ref, { address: nextAddress });
        batchWrites += 1;
      }
    }

    if (!dryRun && batchWrites > 0) {
      await batch.commit();
    }
    console.log(`Processed ${Math.min(offset + chunk.length, entries.length)} / ${entries.length}`);
  }

  console.log({ updated, unchanged, alreadyGood, missing, dryRun });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
