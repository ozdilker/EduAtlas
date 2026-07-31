/**
 * Re-applies MEB `KURUM_TUR_ADI` → InstitutionType on existing Firestore docs.
 *
 * Usage (repo root):
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/retag-institution-types-from-meb.ts
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/retag-institution-types-from-meb.ts --dry-run
 */
import { readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveImportSlug, type InstitutionType } from "@eduatlas/domain";
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

async function main() {
  initAdmin();
  const db = getFirestore();
  const upload = findLatestMebUpload();
  const parsed = await parseImportFile(upload);
  const normalized = normalizeInstitutionImportRows(parsed.rows);

  const typeByDocId = new Map<string, InstitutionType>();
  for (const row of normalized) {
    const slug = resolveImportSlug(row);
    const id = importInstitutionId(slug);
    typeByDocId.set(id, row.primaryType as InstitutionType);
  }

  console.log(`Mapped ${typeByDocId.size} import rows → institution ids (dryRun=${dryRun})`);

  const counts = new Map<string, number>();
  let updated = 0;
  let missing = 0;
  let unchanged = 0;
  const entries = [...typeByDocId.entries()];

  for (let offset = 0; offset < entries.length; offset += 400) {
    const chunk = entries.slice(offset, offset + 400);
    const refs = chunk.map(([id]) => db.collection(INSTITUTIONS_COLLECTION).doc(id));
    const snaps = await db.getAll(...refs);
    const batch = db.batch();
    let batchWrites = 0;

    for (let index = 0; index < chunk.length; index += 1) {
      const [id, nextType] = chunk[index]!;
      const snap = snaps[index];
      if (!snap?.exists) {
        missing += 1;
        continue;
      }
      const current = String(snap.data()?.primaryTypeId ?? "");
      counts.set(nextType, (counts.get(nextType) ?? 0) + 1);
      if (current === nextType) {
        unchanged += 1;
        continue;
      }
      updated += 1;
      if (!dryRun) {
        batch.update(snap.ref, {
          primaryTypeId: nextType,
        });
        batchWrites += 1;
      }
    }

    if (!dryRun && batchWrites > 0) {
      await batch.commit();
    }
    console.log(`Processed ${Math.min(offset + chunk.length, entries.length)} / ${entries.length}`);
  }

  console.log("Target type distribution (existing docs matched):");
  for (const [type, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}=${count}`);
  }
  console.log({ updated, unchanged, missing, dryRun });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
