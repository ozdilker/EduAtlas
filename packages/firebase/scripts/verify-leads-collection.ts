/**
 * Creates leads collection sample + verifies read/write via LeadRepository.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { submitLead } from "@eduatlas/application";
import { InstitutionStatus, leadIdAsString } from "@eduatlas/domain";
import {
  createFirestoreInstitutionRepository,
  createFirestoreLeadRepository,
  getAdminFirestore,
  LEADS_COLLECTION,
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
const institutionRepository = createFirestoreInstitutionRepository(firestore);
const leadRepository = createFirestoreLeadRepository(firestore);

const institutions = await institutionRepository.list({ page: 1, pageSize: 5 });
const institution =
  institutions.items.find((item) => item.status === InstitutionStatus.Published) ??
  institutions.items[0];

if (!institution) {
  throw new Error("No institution available to attach a development lead.");
}

const existing = await leadRepository.getById(
  (await import("@eduatlas/domain")).createLeadId("lead_dev_smoke_1"),
);

const result = existing
  ? { lead: existing }
  : await submitLead(
      {
        institutionId: institution.id.value,
        parentName: "Geliştirme Ebeveyn",
        phone: "+90 532 555 44 33",
        message: "EduAtlas geliştirme ortamı için örnek bilgi talebi.",
        consentAccepted: true,
        leadId: "lead_dev_smoke_1",
        now: new Date().toISOString(),
      },
      { institutionRepository, leadRepository },
    );

const loaded = await leadRepository.getById(result.lead.id);
const listed = await leadRepository.listByInstitutionId(institution.id.value);
const snapshot = await firestore.collection(LEADS_COLLECTION).limit(5).get();

const required = [
  "institutionId",
  "parentName",
  "phone",
  "message",
  "role",
  "status",
  "consentAcceptedAt",
  "consentPolicyVersion",
  "createdAt",
  "updatedAt",
] as const;

const schemaIssues: string[] = [];
for (const doc of snapshot.docs) {
  const data = doc.data();
  for (const field of required) {
    if (!data[field]) {
      schemaIssues.push(`${doc.id}: missing ${field}`);
    }
  }
}

console.log(
  JSON.stringify(
    {
      collection: LEADS_COLLECTION,
      writtenLeadId: leadIdAsString(result.lead.id),
      readBack: Boolean(loaded),
      listedCount: listed.length,
      totalSampleDocs: snapshot.size,
      schemaIssues,
    },
    null,
    2,
  ),
);

if (!loaded) {
  throw new Error("Lead write/read verification failed.");
}
if (schemaIssues.length > 0) {
  throw new Error(`Lead schema validation failed: ${schemaIssues.join(" | ")}`);
}
