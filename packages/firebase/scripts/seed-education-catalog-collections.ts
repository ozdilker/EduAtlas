/**
 * Seeds Firestore education taxonomy collections (no institutions, no UI).
 *
 * Usage: npx tsx packages/firebase/scripts/seed-education-catalog-collections.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getEducationCatalogItemBySlug,
  getEducationCatalogSummary,
  listEducationCatalogItems,
} from "@eduatlas/application";
import { EDUCATION_CATALOG_KINDS, EducationCatalogKind } from "@eduatlas/domain";
import {
  createFirestoreEducationCatalogRepository,
  getAdminFirestore,
  seedEducationCatalogCollections,
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
const result = await seedEducationCatalogCollections(firestore);

const getRepository = (kind: EducationCatalogKind) =>
  createFirestoreEducationCatalogRepository(firestore, kind);

const summary = await getEducationCatalogSummary({ getRepository });
const types = await listEducationCatalogItems(
  { kind: EducationCatalogKind.InstitutionTypes },
  { getRepository },
);
const anaokulu = await getEducationCatalogItemBySlug(
  { kind: EducationCatalogKind.InstitutionTypes, slug: "anaokulu" },
  { getRepository },
);

const payload = {
  ...result,
  summary,
  listedInstitutionTypeCount: types.length,
  sampleAnaokulu: anaokulu
    ? { id: anaokulu.id.value, name: anaokulu.name, status: anaokulu.status }
    : null,
  expectedKinds: EDUCATION_CATALOG_KINDS,
};

console.log(JSON.stringify(payload, null, 2));

if (result.collections.length !== 7) {
  throw new Error(`Expected 7 collections, got ${result.collections.length}`);
}
if (types.length !== 6) {
  throw new Error(`Expected 6 institution types, got ${types.length}`);
}
if (!anaokulu) {
  throw new Error("Missing anaokulu institution type after seed.");
}
if (summary.totalItems !== result.totalWritten) {
  throw new Error("Summary total does not match written count.");
}
