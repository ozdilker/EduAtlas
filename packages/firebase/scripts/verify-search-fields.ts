/**
 * MCP verification helper: institutions collection search-field audit.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInstitutionSearchQuery } from "@eduatlas/application";
import {
  createFirestoreInstitutionRepository,
  getAdminFirestore,
  INSTITUTIONS_COLLECTION,
} from "../src/server/index";

const envPath = resolve("apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq);
  let value = trimmed.slice(eq + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const firestore = getAdminFirestore();
const snapshot = await firestore.collection(INSTITUTIONS_COLLECTION).get();
const missingSearchFields: string[] = [];
let publishedCount = 0;

for (const doc of snapshot.docs) {
  const data = doc.data();
  if (data.lifecycleStatus !== "published") continue;
  publishedCount += 1;

  if (!data.slug) missingSearchFields.push(`${doc.id}: slug`);
  if (!Array.isArray(data.searchKeywords) || data.searchKeywords.length === 0) {
    missingSearchFields.push(`${doc.id}: keywords`);
  }
  if (!data.primaryTypeId) missingSearchFields.push(`${doc.id}: type`);
  if (!data.cityId && !data.cityName) missingSearchFields.push(`${doc.id}: city`);
  if (!data.districtId && !data.districtName) missingSearchFields.push(`${doc.id}: district`);
  if (!data.nameFolded) missingSearchFields.push(`${doc.id}: nameFolded`);
}

const repository = createFirestoreInstitutionRepository(firestore);
const sample = await repository.search(
  createInstitutionSearchQuery({ text: "kolej", pageSize: 5 }),
);

console.log(
  JSON.stringify(
    {
      collection: INSTITUTIONS_COLLECTION,
      totalDocuments: snapshot.size,
      publishedCount,
      missingSearchFields,
      sampleSearchHits: sample.page.totalItems,
      sampleTopSlug: sample.page.items[0]?.slug ?? null,
    },
    null,
    2,
  ),
);

if (missingSearchFields.length > 0) {
  throw new Error(`Missing search fields: ${missingSearchFields.join(" | ")}`);
}
