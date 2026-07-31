/**
 * Verifies owner profile update allowlist + repository read/write against Firestore.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getOwnerInstitutionProfile, updateInstitutionProfile } from "@eduatlas/application";
import { createInstitutionId } from "@eduatlas/domain";
import { createFirestoreInstitutionRepository, getAdminFirestore } from "../src/server/index";

const OWNER_DEMO_INSTITUTION_ID = "seed_inst_ist_kolej_1";
const MARKER = `[Task-015 verify ${new Date().toISOString()}]`;

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

const before = await getOwnerInstitutionProfile(
  { institutionId: OWNER_DEMO_INSTITUTION_ID },
  { institutionRepository },
);

if (!before) {
  throw new Error("Expected published development institution for profile update.");
}

const editableKeys = [
  "shortDescription",
  "longDescription",
  "phone",
  "email",
  "websiteUrl",
  "facebookUrl",
  "instagramUrl",
  "twitterUrl",
  "youtubeUrl",
  "linkedinUrl",
  "updatedAt",
  "updatedBy",
] as const;

const result = await updateInstitutionProfile(
  {
    institutionId: OWNER_DEMO_INSTITUTION_ID,
    shortDescription: before.shortDescription.includes(MARKER)
      ? before.shortDescription
      : `${before.shortDescription} ${MARKER}`.slice(0, 500),
    longDescription:
      before.longDescription?.includes(MARKER) === true
        ? before.longDescription
        : `${before.longDescription ?? before.shortDescription}\n\n${MARKER}`.slice(0, 5000),
    phone: before.contact.phone,
    email: before.contact.email,
    websiteUrl: before.socialLinks.websiteUrl ?? "https://www.marmarakoleji.k12.tr",
    facebookUrl: before.socialLinks.facebookUrl,
    instagramUrl: before.socialLinks.instagramUrl,
    twitterUrl: before.socialLinks.twitterUrl,
    youtubeUrl: before.socialLinks.youtubeUrl,
    linkedinUrl: before.socialLinks.linkedinUrl,
    updatedBy: "owner_demo_task_015",
  },
  { institutionRepository },
);

const after = await institutionRepository.getById(createInstitutionId(OWNER_DEMO_INSTITUTION_ID));

if (!after) {
  throw new Error("Repository read after update returned null.");
}

const mismatches: string[] = [];

if (after.shortDescription !== result.institution.shortDescription) {
  mismatches.push("shortDescription mismatch after read");
}
if (after.longDescription !== result.institution.longDescription) {
  mismatches.push("longDescription mismatch after read");
}
if (after.updatedByUserId !== "owner_demo_task_015") {
  mismatches.push(`updatedByUserId=${after.updatedByUserId}`);
}
if (after.name !== before.name) {
  mismatches.push("name changed (not allowlisted)");
}
if (after.slug !== before.slug) {
  mismatches.push("slug changed (not allowlisted)");
}
if (after.programsSummary !== before.programsSummary) {
  mismatches.push("programsSummary changed (placeholder / not editable)");
}
if (!after.longDescription?.includes(MARKER) && !after.shortDescription.includes(MARKER)) {
  mismatches.push("marker missing from updated published fields");
}

console.log(
  JSON.stringify(
    {
      institutionId: OWNER_DEMO_INSTITUTION_ID,
      editableSchema: editableKeys,
      beforeUpdatedAt: before.updatedAt,
      afterUpdatedAt: after.updatedAt,
      updatedByUserId: after.updatedByUserId,
      shortDescriptionPreview: after.shortDescription.slice(0, 120),
      longDescriptionPreview: (after.longDescription ?? "").slice(0, 120),
      mismatches,
    },
    null,
    2,
  ),
);

if (mismatches.length > 0) {
  throw new Error(`Owner profile update verification failed: ${mismatches.join(" | ")}`);
}
