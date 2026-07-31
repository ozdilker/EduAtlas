/**
 * Verifies owner dashboard lead aggregation against Firestore seed data.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getOwnerDashboard } from "@eduatlas/application";
import { LEAD_PIPELINE_STATUSES, LeadStatus } from "@eduatlas/domain";
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
const dashboard = await getOwnerDashboard(
  { institutionId: OWNER_DEMO_INSTITUTION_ID },
  { institutionRepository, leadRepository },
);

if (!dashboard) {
  throw new Error("Owner dashboard returned null for development seed institution.");
}

const pendingManual = listed.filter((lead) => lead.status === LeadStatus.New).length;
const mismatches: string[] = [];

if (dashboard.leadSummary.total !== listed.length) {
  mismatches.push(`total ${dashboard.leadSummary.total} !== ${listed.length}`);
}
if (dashboard.leadSummary.pending !== pendingManual) {
  mismatches.push(`pending ${dashboard.leadSummary.pending} !== ${pendingManual}`);
}

for (const status of LEAD_PIPELINE_STATUSES) {
  const manual = listed.filter((lead) => lead.status === status).length;
  if (dashboard.leadSummary.byPipeline[status] !== manual) {
    mismatches.push(`pipeline.${status} ${dashboard.leadSummary.byPipeline[status]} !== ${manual}`);
  }
}

console.log(
  JSON.stringify(
    {
      institutionId: OWNER_DEMO_INSTITUTION_ID,
      institutionName: dashboard.institutionSummary.institution.name,
      listedCount: listed.length,
      leadSummary: dashboard.leadSummary,
      mismatches,
    },
    null,
    2,
  ),
);

if (mismatches.length > 0) {
  throw new Error(`Lead aggregation mismatch: ${mismatches.join(" | ")}`);
}
if (listed.length < 1) {
  throw new Error("Expected development seed leads for owner dashboard.");
}
