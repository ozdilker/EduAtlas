/**
 * JS runner for local emulator verification (firebase emulators:exec expects a single script arg).
 */

import {
  getAdminFirestore,
  createFirestoreInstitutionRepository,
  createFirestoreLeadRepository,
} from "../src/server/index.js";
import {
  createInstitutionId,
  createLead,
  createLeadId,
  LeadRole,
  LeadStatus,
} from "@eduatlas/domain";
import { buildOwnerLeadSummary } from "@eduatlas/application";
import { FirestoreInstitutionMapper } from "../src/institutions/firestore-institution-mapper.js";
import { institutionSeedToDomain, loadInstitutionSeedDataset } from "../src/seeds/seed-loader.js";

const OWNER_DEMO_INSTITUTION_ID = "seed_inst_ist_kolej_1";
const MIN_LEADS = 8;

const SAMPLE_LEADS = Object.freeze([
  { id: "seed_lead_em_01", status: LeadStatus.New, email: "new1@example.com" },
  { id: "seed_lead_em_02", status: LeadStatus.Read },
  { id: "seed_lead_em_03", status: LeadStatus.Contacted },
  { id: "seed_lead_em_04", status: LeadStatus.Appointment },
  { id: "seed_lead_em_05", status: LeadStatus.Enrolled },
  { id: "seed_lead_em_06", status: LeadStatus.Lost },
  { id: "seed_lead_em_07", status: LeadStatus.Closed },
  { id: "seed_lead_em_08", status: LeadStatus.Spam },
]);

async function upsertSeedInstitution(firestore) {
  const seeds = loadInstitutionSeedDataset();
  const seed = seeds.find((s) => s.id === OWNER_DEMO_INSTITUTION_ID);
  if (!seed) {
    throw new Error(`Institution seed not found: ${OWNER_DEMO_INSTITUTION_ID}`);
  }

  const institution = institutionSeedToDomain(seed);
  const id = FirestoreInstitutionMapper.institutionDocId(institution);
  await firestore
    .collection("institutions")
    .doc(id)
    .set(FirestoreInstitutionMapper.toFirestore(institution), { merge: true });
}

async function main() {
  const firestore = getAdminFirestore();
  const institutionRepository = createFirestoreInstitutionRepository(firestore);
  const leadRepository = createFirestoreLeadRepository(firestore);

  await upsertSeedInstitution(firestore);

  // Ensure leads exist (fixed ids so the test is repeatable).
  for (const [index, sample] of SAMPLE_LEADS.entries()) {
    const leadId = createLeadId(sample.id);
    const existing = await leadRepository.getById(leadId);
    if (existing) continue;

    const createdAt = new Date(Date.now() - index * 60 * 60 * 1000).toISOString();
    const lead = createLead({
      id: leadId,
      institutionId: OWNER_DEMO_INSTITUTION_ID,
      parentName: "Lead Emulator Parent",
      phone: "+90 500 000 00 00",
      message: "Emulator test lead",
      role: LeadRole.Parent,
      status: sample.status,
      email: sample.email,
      preferredContactTime: undefined,
      consentAcceptedAt: createdAt,
      consentPolicyVersion: "kvkk-lead-v1",
      createdAt,
      updatedAt: createdAt,
    });

    await leadRepository.save(lead);
  }

  const leads = await leadRepository.listByInstitutionId(OWNER_DEMO_INSTITUTION_ID);
  if (leads.length < MIN_LEADS) {
    throw new Error(`Expected >= ${MIN_LEADS} leads for verification; got ${leads.length}.`);
  }

  const institution = await institutionRepository.getById(createInstitutionId(OWNER_DEMO_INSTITUTION_ID));
  if (!institution) {
    throw new Error("Institution not found for verification.");
  }

  if (!institution.leadCounters) {
    throw new Error("leadCounters is missing on institution. Expected updateLeadCounters triggers to populate it.");
  }

  const expected = buildOwnerLeadSummary({ leads });
  const actual = institution.leadCounters;

  const mismatch = [];
  if (actual.total !== expected.total) mismatch.push(`total ${actual.total} !== ${expected.total}`);
  if (actual.pending !== expected.pending) mismatch.push(`pending ${actual.pending} !== ${expected.pending}`);

  for (const key of Object.keys(expected.byStatus)) {
    const a = actual.byStatus[key];
    const e = expected.byStatus[key];
    if (a !== e) mismatch.push(`byStatus.${key} ${a} !== ${e}`);
  }

  for (const key of Object.keys(expected.byPipeline)) {
    const a = actual.byPipeline[key];
    const e = expected.byPipeline[key];
    if (a !== e) mismatch.push(`byPipeline.${key} ${a} !== ${e}`);
  }

  if (mismatch.length > 0) {
    throw new Error(`leadCounters mismatch: ${mismatch.join(" | ")}`);
  }

  console.log(
    JSON.stringify(
      {
        institutionId: OWNER_DEMO_INSTITUTION_ID,
        leadsCount: leads.length,
        leadCounters: actual,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

