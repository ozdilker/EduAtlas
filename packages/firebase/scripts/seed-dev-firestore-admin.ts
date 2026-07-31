/**
 * Seeds Cloud Firestore using the Firebase CLI OAuth access token.
 * Admin-style REST writes bypass security rules.
 *
 * Usage:
 *   npx tsx packages/firebase/scripts/seed-dev-firestore-admin.ts
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { INSTITUTIONS_COLLECTION } from "../src/institutions/firestore-institution-document";
import { FirestoreInstitutionMapper } from "../src/institutions/firestore-institution-mapper";
import {
  institutionSeedToDomain,
  loadInstitutionSeedDataset,
  resolveSeedSearchKeywords,
} from "../src/seeds/seed-loader";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "eduatlas-dev";

function readFirebaseCliAccessToken(): string {
  const configPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
  const raw = fs.readFileSync(configPath, "utf8");
  const match = raw.match(/"access_token"\s*:\s*"([^"]+)"/);
  if (!match?.[1]) {
    throw new Error("Firebase CLI access_token not found. Run: npx firebase-tools login");
  }
  return match[1];
}

async function upsertInstitution(
  token: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${INSTITUTIONS_COLLECTION}/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upsert ${id}: ${response.status} ${text}`);
  }
}

async function fetchAllInstitutions(token: string): Promise<
  Array<{
    name: string;
    fields: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean }>;
  }>
> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${INSTITUTIONS_COLLECTION}?pageSize=100`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to list institutions: ${response.status} ${text}`);
  }
  const json = (await response.json()) as {
    documents?: Array<{
      name: string;
      fields: Record<
        string,
        {
          stringValue?: string;
          integerValue?: string;
          booleanValue?: boolean;
          doubleValue?: number;
        }
      >;
    }>;
  };
  return json.documents ?? [];
}

function toFirestoreFields(data: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    fields[key] = encodeValue(value);
  }
  return fields;
}

function encodeValue(value: unknown): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => encodeValue(item)),
      },
    };
  }
  throw new Error(`Unsupported Firestore value type: ${typeof value}`);
}

function fieldString(
  fields: Record<string, { stringValue?: string; arrayValue?: { values?: unknown[] } }>,
  key: string,
): string | undefined {
  return fields[key]?.stringValue;
}

function fieldArrayLength(
  fields: Record<string, { arrayValue?: { values?: unknown[] } }>,
  key: string,
): number {
  return fields[key]?.arrayValue?.values?.length ?? 0;
}

async function main(): Promise<void> {
  const token = readFirebaseCliAccessToken();
  const seeds = loadInstitutionSeedDataset();
  let written = 0;

  for (const seed of seeds) {
    const institution = institutionSeedToDomain(seed);
    const id = FirestoreInstitutionMapper.institutionDocId(institution);
    const data = FirestoreInstitutionMapper.toFirestore(institution, {
      searchKeywords: resolveSeedSearchKeywords(seed),
      cityName: seed.city,
      districtName: seed.district,
    }) as Record<string, unknown>;
    await upsertInstitution(token, id, data);
    written += 1;
  }

  const documents = await fetchAllInstitutions(token);
  const required = [
    "name",
    "slug",
    "primaryTypeId",
    "lifecycleStatus",
    "claimStatus",
    "cityId",
    "districtId",
    "address",
    "shortDescription",
    "nameFolded",
    "createdAt",
    "updatedAt",
  ] as const;

  const inconsistencies: string[] = [];
  const missingSearchFields: string[] = [];
  for (const doc of documents) {
    const id = doc.name.split("/").at(-1) ?? doc.name;
    const status = fieldString(doc.fields, "lifecycleStatus");
    for (const field of required) {
      if (!fieldString(doc.fields, field)) {
        inconsistencies.push(`${id}: missing ${field}`);
      }
    }
    if (status === "published") {
      if (!fieldString(doc.fields, "slug")) missingSearchFields.push(`${id}: slug`);
      if (fieldArrayLength(doc.fields, "searchKeywords") === 0) {
        missingSearchFields.push(`${id}: keywords`);
      }
      if (!fieldString(doc.fields, "primaryTypeId")) missingSearchFields.push(`${id}: type`);
      if (!fieldString(doc.fields, "cityId") && !fieldString(doc.fields, "cityName")) {
        missingSearchFields.push(`${id}: city`);
      }
      if (!fieldString(doc.fields, "districtId") && !fieldString(doc.fields, "districtName")) {
        missingSearchFields.push(`${id}: district`);
      }
      if (!fieldString(doc.fields, "publishedAt")) {
        inconsistencies.push(`${id}: published without publishedAt`);
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        written,
        totalDocuments: documents.length,
        projectId: PROJECT_ID,
        collection: INSTITUTIONS_COLLECTION,
        inconsistencies,
        missingSearchFields,
      },
      null,
      2,
    ),
  );

  if (documents.length < 20) {
    throw new Error(`Expected at least 20 institutions, found ${documents.length}.`);
  }
  if (inconsistencies.length > 0 || missingSearchFields.length > 0) {
    throw new Error(
      `Validation failed: ${[...inconsistencies, ...missingSearchFields].join(" | ")}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
