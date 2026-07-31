/**
 * Spreads development leads across pipeline stages and verifies updateLeadStatus + aggregation.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildOwnerLeadSummary,
  getOwnerDashboard,
  getOwnerLeadPipeline,
  updateLeadStatus,
} from "@eduatlas/application";
import {
  createInstitutionId,
  createLeadId,
  LEAD_PIPELINE_STATUSES,
  LeadStatus,
  leadIdAsString,
} from "@eduatlas/domain";
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

let listed = await leadRepository.listByInstitutionId(OWNER_DEMO_INSTITUTION_ID);
if (listed.length < LEAD_PIPELINE_STATUSES.length) {
  throw new Error(
    `Need at least ${LEAD_PIPELINE_STATUSES.length} leads to cover pipeline stages; found ${listed.length}.`,
  );
}

const assignments = listed.map((lead, index) => {
  const status = LEAD_PIPELINE_STATUSES[index % LEAD_PIPELINE_STATUSES.length];
  if (!status) {
    throw new Error("Pipeline status mapping failed.");
  }
  return {
    leadId: leadIdAsString(lead.id),
    status,
  };
});

const updatedIds: string[] = [];
for (const assignment of assignments) {
  const result = await updateLeadStatus(
    {
      leadId: assignment.leadId,
      status: assignment.status,
      institutionId: OWNER_DEMO_INSTITUTION_ID,
    },
    { leadRepository },
  );
  updatedIds.push(leadIdAsString(result.lead.id));
}

// Round-trip one lead through appointment to prove repository update
const probe = assignments[0];
if (!probe) {
  throw new Error("No lead available for status probe.");
}
const probeId = probe.leadId;
await updateLeadStatus(
  { leadId: probeId, status: LeadStatus.Appointment, institutionId: OWNER_DEMO_INSTITUTION_ID },
  { leadRepository },
);
const probeLead = await leadRepository.getById(createLeadId(probeId));
if (!probeLead || probeLead.status !== LeadStatus.Appointment) {
  throw new Error("Lead status update verification failed.");
}

listed = await leadRepository.listByInstitutionId(OWNER_DEMO_INSTITUTION_ID);
const institution = await institutionRepository.getById(
  createInstitutionId(OWNER_DEMO_INSTITUTION_ID),
);
if (!institution) {
  throw new Error("Institution not found for leadCounters verification.");
}
if (!institution.leadCounters) {
  throw new Error(
    "leadCounters is missing on institution. Triggers may not be deployed (or did not run).",
  );
}

const dashboard = await getOwnerDashboard(
  { institutionId: OWNER_DEMO_INSTITUTION_ID },
  { institutionRepository, leadRepository },
);
const pipeline = await getOwnerLeadPipeline(
  { institutionId: OWNER_DEMO_INSTITUTION_ID },
  { leadRepository },
);

if (!dashboard) {
  throw new Error("Dashboard null after pipeline seed.");
}

// Hard verification: counters must match the manual lead list.
const expected = buildOwnerLeadSummary({ leads: listed });
const actual = institution.leadCounters;
const mismatchesCounters: string[] = [];
if (actual.total !== expected.total) mismatchesCounters.push(`total ${actual.total} !== ${expected.total}`);
if (actual.pending !== expected.pending) mismatchesCounters.push(`pending ${actual.pending} !== ${expected.pending}`);

for (const key of Object.keys(expected.byStatus) as Array<keyof typeof expected.byStatus>) {
  if (actual.byStatus[key] !== expected.byStatus[key]) {
    mismatchesCounters.push(
      `byStatus.${key} ${actual.byStatus[key]} !== ${expected.byStatus[key]}`,
    );
  }
}

for (const key of Object.keys(expected.byPipeline) as Array<keyof typeof expected.byPipeline>) {
  if (actual.byPipeline[key] !== expected.byPipeline[key]) {
    mismatchesCounters.push(
      `byPipeline.${key} ${actual.byPipeline[key]} !== ${expected.byPipeline[key]}`,
    );
  }
}

if (mismatchesCounters.length > 0) {
  throw new Error(`leadCounters mismatch: ${mismatchesCounters.join(" | ")}`);
}

const mismatches: string[] = [];
for (const status of LEAD_PIPELINE_STATUSES) {
  const manual = listed.filter((lead) => lead.status === status).length;
  const summary = dashboard.leadSummary.byPipeline[status];
  const column = pipeline.columns.find((item) => item.status === status)?.count ?? -1;
  if (summary !== manual) {
    mismatches.push(`summary.${status} ${summary} !== ${manual}`);
  }
  if (column !== manual) {
    mismatches.push(`pipeline.${status} ${column} !== ${manual}`);
  }
}

console.log(
  JSON.stringify(
    {
      institutionId: OWNER_DEMO_INSTITUTION_ID,
      updatedCount: updatedIds.length,
      probeLeadId: probeId,
      probeStatus: probeLead.status,
      byPipeline: dashboard.leadSummary.byPipeline,
      pipelineCounts: Object.fromEntries(
        pipeline.columns.map((column) => [column.status, column.count]),
      ),
      mismatches,
    },
    null,
    2,
  ),
);

if (mismatches.length > 0) {
  throw new Error(`Pipeline aggregation mismatch: ${mismatches.join(" | ")}`);
}
