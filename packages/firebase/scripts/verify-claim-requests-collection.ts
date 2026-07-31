/**
 * Creates claim_requests collection sample + verifies read/write via ClaimRequestRepository.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { submitClaimRequest } from "@eduatlas/application";
import {
  ClaimRequestStatus,
  claimRequestIdAsString,
  createClaimRequestId,
  InstitutionStatus,
} from "@eduatlas/domain";
import {
  CLAIM_REQUESTS_COLLECTION,
  createFirestoreClaimRequestRepository,
  createFirestoreInstitutionRepository,
  getAdminFirestore,
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
const claimRequestRepository = createFirestoreClaimRequestRepository(firestore);

const institutions = await institutionRepository.list({ page: 1, pageSize: 10 });
const institution =
  institutions.items.find((item) => item.id.value === "seed_inst_ist_kolej_1") ??
  institutions.items.find((item) => item.status === InstitutionStatus.Published) ??
  institutions.items[0];

if (!institution) {
  throw new Error("No institution available to attach a development claim request.");
}

const existing = await claimRequestRepository.getById(createClaimRequestId("claim_dev_smoke_1"));

const result = existing
  ? { claimRequest: existing }
  : await submitClaimRequest(
      {
        institutionId: institution.id.value,
        applicantName: "Geliştirme Kurum Sahibi",
        role: "owner",
        phone: "+90 532 444 33 22",
        email: "owner.dev@example.com",
        message: "EduAtlas geliştirme ortamı için örnek sahiplenme talebi.",
        evidenceUrl: "https://example.com/eduatlas-claim-proof.pdf",
        claimRequestId: "claim_dev_smoke_1",
        now: new Date().toISOString(),
      },
      { institutionRepository, claimRequestRepository },
    );

const loaded = await claimRequestRepository.getById(result.claimRequest.id);
const listed = await claimRequestRepository.listByInstitutionId(institution.id.value);
const snapshot = await firestore.collection(CLAIM_REQUESTS_COLLECTION).limit(5).get();

const required = [
  "institutionId",
  "applicantName",
  "role",
  "phone",
  "email",
  "message",
  "status",
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
  if (
    data.status !== ClaimRequestStatus.Pending &&
    data.status !== "approved" &&
    data.status !== "rejected"
  ) {
    schemaIssues.push(`${doc.id}: invalid status ${String(data.status)}`);
  }
}

console.log(
  JSON.stringify(
    {
      collection: CLAIM_REQUESTS_COLLECTION,
      writtenClaimRequestId: claimRequestIdAsString(result.claimRequest.id),
      institutionId: institution.id.value,
      status: result.claimRequest.status,
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
  throw new Error("Claim request write/read verification failed.");
}
if (schemaIssues.length > 0) {
  throw new Error(`Claim request schema validation failed: ${schemaIssues.join(" | ")}`);
}
if (result.claimRequest.status !== ClaimRequestStatus.Pending) {
  throw new Error("Development claim must start in pending review status.");
}
