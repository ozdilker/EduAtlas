/**
 * Runs Institution Quality Engine against seeded institutions and validates distribution.
 * Uses Firebase Admin via repository (no UI → Firestore). Also verifies via MCP listing.
 *
 * Usage: npx tsx packages/firebase/scripts/verify-institution-quality-engine.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculateInstitutionQuality } from "@eduatlas/application";
import { QualityGrade, QualityLevel } from "@eduatlas/domain";
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

const firestore = getAdminFirestore();
const institutionRepository = createFirestoreInstitutionRepository(firestore);
const page = await institutionRepository.list({ page: 1, pageSize: 500 });

if (page.items.length === 0) {
  throw new Error("No seeded institutions found to score.");
}

const byGrade: Record<QualityGrade, number> = {
  [QualityGrade.A]: 0,
  [QualityGrade.B]: 0,
  [QualityGrade.C]: 0,
  [QualityGrade.D]: 0,
  [QualityGrade.E]: 0,
  [QualityGrade.F]: 0,
};
const byLevel: Record<QualityLevel, number> = {
  [QualityLevel.Critical]: 0,
  [QualityLevel.NeedsWork]: 0,
  [QualityLevel.Healthy]: 0,
  [QualityLevel.Excellent]: 0,
};

let sum = 0;
let min = 100;
let max = 0;
const samples: Array<{
  id: string;
  score: number;
  grade: QualityGrade;
  level: QualityLevel;
  missingCount: number;
}> = [];

for (const institution of page.items) {
  const { quality } = calculateInstitutionQuality({ institution });
  byGrade[quality.grade] += 1;
  byLevel[quality.qualityLevel] += 1;
  sum += quality.score;
  min = Math.min(min, quality.score);
  max = Math.max(max, quality.score);
  samples.push({
    id: institution.id.value,
    score: quality.score,
    grade: quality.grade,
    level: quality.qualityLevel,
    missingCount: quality.missingFields.length,
  });
}

samples.sort((left, right) => right.score - left.score);
const average = Math.round(sum / page.items.length);
const collectionSnap = await firestore.collection("institutions").limit(5).get();

const payload = {
  scoredInstitutions: page.items.length,
  averageScore: average,
  minScore: min,
  maxScore: max,
  byGrade,
  byLevel,
  top3: samples.slice(0, 3),
  bottom3: samples.slice(-3).reverse(),
  firestoreInstitutionsSample: collectionSnap.size,
  note: "Internal Institution Quality Score — not public Growth Score.",
};

console.log(JSON.stringify(payload, null, 2));

if (average < 0 || average > 100) {
  throw new Error(`Average score out of range: ${average}`);
}
if (Object.values(byGrade).reduce((a, b) => a + b, 0) !== page.items.length) {
  throw new Error("Grade distribution does not match scored count.");
}
if (collectionSnap.empty) {
  throw new Error("institutions collection appears empty in Firestore.");
}
