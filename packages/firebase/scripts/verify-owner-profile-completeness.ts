/**
 * Verifies Profile Completeness Engine against Firestore development seed data.
 * Not Growth Score.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateInstitutionProfileCompleteness } from "@eduatlas/application";
import { ProfileCompletenessSectionId } from "@eduatlas/domain";
import { createFirestoreInstitutionRepository, getAdminFirestore } from "../src/server/index";

const OWNER_DEMO_INSTITUTION_ID = "seed_inst_ist_kolej_1";

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
const institutionRepository = createFirestoreInstitutionRepository(firestore);

const result = await calculateInstitutionProfileCompleteness(
  { institutionId: OWNER_DEMO_INSTITUTION_ID },
  { institutionRepository },
);

if (!result) {
  throw new Error("Expected development institution for profile completeness.");
}

const missingIds = result.missingSections.map((section) => section.id);
const completedIds = result.completedSections.map((section) => section.id);
const totalWeight = result.sections.reduce((sum, section) => sum + section.weight, 0);

console.log(
  JSON.stringify(
    {
      institutionId: result.institutionId,
      overallPercentage: result.overallPercentage,
      nextActionHint: result.nextActionHint,
      completedSections: completedIds,
      missingSections: missingIds,
      missingLabels: result.missingSections.map((section) => section.label),
      totalWeight,
      sectionCount: result.sections.length,
    },
    null,
    2,
  ),
);

if (result.sections.length !== 9) {
  throw new Error(`Expected 9 completeness sections, got ${result.sections.length}`);
}
if (totalWeight !== 100) {
  throw new Error(`Expected section weights to total 100, got ${totalWeight}`);
}
if (result.overallPercentage < 0 || result.overallPercentage > 100) {
  throw new Error(`Invalid overallPercentage: ${result.overallPercentage}`);
}
if (result.completedSections.length + result.missingSections.length !== result.sections.length) {
  throw new Error("completed + missing must equal all sections.");
}
if (result.missingSections.length === 0 && result.overallPercentage !== 100) {
  throw new Error("No missing sections but overallPercentage is not 100.");
}
if (
  missingIds.includes(ProfileCompletenessSectionId.Gallery) &&
  !result.nextActionHint.toLowerCase().includes("galeri") &&
  result.missingSections[0]?.id === ProfileCompletenessSectionId.Gallery
) {
  throw new Error("Gallery missing should drive nextActionHint when it is highest weight.");
}
