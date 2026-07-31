/**
 * Verifies institutions collection via InstitutionRepository (Admin SDK).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { institutionIdAsString } from "@eduatlas/domain";
import { createFirestoreInstitutionRepository, getAdminFirestore } from "../src/server/index";

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

const repository = createFirestoreInstitutionRepository(getAdminFirestore());
const page = await repository.list({ page: 1, pageSize: 50 });
const sample = await repository.getBySlug("kadikoy-marmara-koleji");

const requiredMissing: string[] = [];
for (const institution of page.items) {
  const id = institutionIdAsString(institution.id);
  if (!institution.name) requiredMissing.push(`${id}: name`);
  if (!institution.slug) requiredMissing.push(`${id}: slug`);
  if (!institution.primaryType) requiredMissing.push(`${id}: primaryType`);
  if (!institution.status) requiredMissing.push(`${id}: status`);
  if (!institution.verification) requiredMissing.push(`${id}: verification`);
  if (!institution.location.cityId) requiredMissing.push(`${id}: cityId`);
  if (!institution.location.districtId) requiredMissing.push(`${id}: districtId`);
  if (!institution.location.address) requiredMissing.push(`${id}: address`);
  if (!institution.shortDescription) requiredMissing.push(`${id}: shortDescription`);
  if (!institution.createdAt) requiredMissing.push(`${id}: createdAt`);
  if (!institution.updatedAt) requiredMissing.push(`${id}: updatedAt`);
}

console.log(
  JSON.stringify(
    {
      totalDocuments: page.totalItems,
      sampleName: sample?.name ?? null,
      sampleCityId: sample?.location.cityId ?? null,
      requiredMissing,
    },
    null,
    2,
  ),
);

if (page.totalItems < 20) {
  throw new Error(`Expected >= 20 institutions, found ${page.totalItems}`);
}
if (!sample) {
  throw new Error("Expected kadikoy-marmara-koleji to be readable via repository");
}
if (requiredMissing.length > 0) {
  throw new Error(requiredMissing.join(" | "));
}
