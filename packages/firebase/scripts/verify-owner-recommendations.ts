/**
 * Verifies rule-based Sales Agent recommendations against Firestore seed data.
 * No LLM / external AI providers.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getOwnerRecommendations } from "@eduatlas/application";
import {
  createFirestoreInstitutionRepository,
  createFirestoreLeadRepository,
  getAdminFirestore,
} from "../src/server/index";

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
const leadRepository = createFirestoreLeadRepository(firestore);

const listed = await leadRepository.listByInstitutionId(OWNER_DEMO_INSTITUTION_ID);
const result = await getOwnerRecommendations(
  { institutionId: OWNER_DEMO_INSTITUTION_ID },
  { institutionRepository, leadRepository },
);

if (!result) {
  throw new Error("getOwnerRecommendations returned null for development seed institution.");
}

const ruleIds = result.recommendations.map((item) => item.ruleId);

console.log(
  JSON.stringify(
    {
      institutionId: result.institutionId,
      listedLeadCount: listed.length,
      recommendationCount: result.count,
      ruleIds,
      recommendations: result.recommendations.map((item) => ({
        ruleId: item.ruleId,
        type: item.type,
        priority: item.priority,
        title: item.title,
      })),
    },
    null,
    2,
  ),
);

if (listed.length < 1) {
  throw new Error("Expected development seed leads for owner recommendations.");
}
if (result.count < 1) {
  throw new Error("Expected at least one Sales Agent recommendation from seed data.");
}
if (result.count !== result.recommendations.length) {
  throw new Error(
    `Recommendation count mismatch: count=${result.count} length=${result.recommendations.length}`,
  );
}
