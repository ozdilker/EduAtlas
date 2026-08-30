/**
 * Reindex institution searchKeywords + nameFolded from the name only.
 *
 * Defaults to dry-run (no writes). Does not run on a request path.
 *
 * Usage (repo root):
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/reindex-institution-search-keywords.ts
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/reindex-institution-search-keywords.ts --apply --limit 200 --cityId istanbul
 */
import { FieldPath } from "firebase-admin/firestore";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { INSTITUTIONS_COLLECTION } from "../src/institutions/firestore-institution-document";
import {
  parseReindexInstitutionSearchArgs,
  planInstitutionSearchKeywordPatch,
} from "../src/institutions/reindex-institution-search-keywords";

const args = parseReindexInstitutionSearchArgs(process.argv.slice(2));

function initAdmin(): void {
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

async function main(): Promise<void> {
  initAdmin();
  const db = getFirestore();
  let scanned = 0;
  let wouldUpdate = 0;
  let skipped = 0;
  let written = 0;
  let cursor = args.cursor;
  const sample: Array<{ id: string; from: unknown; to: unknown }> = [];

  console.log(
    JSON.stringify({
      dryRun: args.dryRun,
      apply: args.apply,
      cityId: args.cityId,
      limit: args.limit,
      batchSize: args.batchSize,
      cursor,
    }),
  );

  while (args.limit === null || scanned < args.limit) {
    const remaining = args.limit === null ? args.batchSize : Math.min(args.batchSize, args.limit - scanned);
    if (remaining <= 0) {
      break;
    }

    let query = db.collection(INSTITUTIONS_COLLECTION).orderBy(FieldPath.documentId()).limit(remaining);
    if (args.cityId) {
      query = db
        .collection(INSTITUTIONS_COLLECTION)
        .where("cityId", "==", args.cityId)
        .orderBy(FieldPath.documentId())
        .limit(remaining);
    }
    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    const writer = args.apply ? db.batch() : null;
    let batchWrites = 0;

    for (const doc of snapshot.docs) {
      scanned += 1;
      const data = doc.data();
      const patch = planInstitutionSearchKeywordPatch({
        id: doc.id,
        name: String(data.name ?? ""),
        nameFolded: typeof data.nameFolded === "string" ? data.nameFolded : undefined,
        searchKeywords: Array.isArray(data.searchKeywords)
          ? data.searchKeywords.map((token) => String(token))
          : undefined,
      });

      if (!patch) {
        skipped += 1;
        continue;
      }

      wouldUpdate += 1;
      if (sample.length < 8) {
        sample.push({
          id: doc.id,
          from: data.searchKeywords ?? [],
          to: patch.searchKeywords,
        });
      }

      if (writer) {
        writer.update(doc.ref, {
          searchKeywords: [...patch.searchKeywords],
          nameFolded: patch.nameFolded,
        });
        batchWrites += 1;
      }
    }

    if (writer && batchWrites > 0) {
      await writer.commit();
      written += batchWrites;
    }

    cursor = snapshot.docs[snapshot.docs.length - 1]?.id ?? cursor;
    if (snapshot.size < remaining) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(
    JSON.stringify(
      {
        dryRun: args.dryRun,
        scanned,
        wouldUpdate,
        skipped,
        written: args.apply ? written : 0,
        lastCursor: cursor,
        sample,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
