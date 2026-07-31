/**
 * Seeds Firebase Auth demo users + custom claims + owner institution binding
 * for the eduatlas-dev demo environment.
 *
 * Usage (from repo root):
 *   npx tsx --env-file=apps/web/.env.local packages/firebase/scripts/seed-demo-auth.ts
 */
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  DEMO_AUTH_USERS,
  DEMO_OWNER_INSTITUTION_ID,
  type DemoAuthUserSpec,
} from "../src/auth/demo-auth-users";
import { INSTITUTION_OWNERS_COLLECTION } from "../src/auth/firestore-owner-binding-repository";
import { INSTITUTIONS_COLLECTION } from "../src/institutions/firestore-institution-document";
import { FirestoreInstitutionMapper } from "../src/institutions/firestore-institution-mapper";
import { institutionSeedToDomain, loadInstitutionSeedDataset } from "../src/seeds/seed-loader";

const PROJECT_ID =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "eduatlas-dev";

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n");
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY. Use --env-file=apps/web/.env.local",
    );
  }

  return initializeApp({
    credential: cert({
      projectId: PROJECT_ID,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    }),
    projectId: PROJECT_ID,
  });
}

async function upsertAuthUser(spec: DemoAuthUserSpec): Promise<string> {
  const auth = getAuth(getAdminApp());
  let uid: string;

  try {
    const existing = await auth.getUserByEmail(spec.email);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password: spec.password,
      emailVerified: spec.emailVerified,
      displayName: spec.displayName,
      disabled: false,
    });
    console.log(`updated auth user ${spec.email} (${uid})`);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code !== "auth/user-not-found") {
      throw error;
    }
    const created = await auth.createUser({
      email: spec.email,
      password: spec.password,
      emailVerified: spec.emailVerified,
      displayName: spec.displayName,
      disabled: false,
    });
    uid = created.uid;
    console.log(`created auth user ${spec.email} (${uid})`);
  }

  await auth.setCustomUserClaims(uid, { ...spec.claims });
  console.log(`set claims for ${spec.email}:`, spec.claims);
  return uid;
}

async function upsertOwnerBinding(userId: string, institutionId: string): Promise<string> {
  const db = getFirestore(getAdminApp());
  const now = new Date().toISOString();
  const docId = `demo_owner_${institutionId}`;
  const ref = db.collection(INSTITUTION_OWNERS_COLLECTION).doc(docId);

  await ref.set(
    {
      userId,
      institutionId,
      status: "approved",
      requestedAt: now,
      approvedAt: now,
      source: "demo-seed",
    },
    { merge: true },
  );

  console.log(`upserted ${INSTITUTION_OWNERS_COLLECTION}/${docId} → ${institutionId}`);
  return docId;
}

async function upsertDemoOwnerInstitution(): Promise<void> {
  const seeds = loadInstitutionSeedDataset();
  const seed = seeds.find((item) => item.id === DEMO_OWNER_INSTITUTION_ID);
  if (!seed) {
    throw new Error(`Demo institution seed missing: ${DEMO_OWNER_INSTITUTION_ID}`);
  }

  const institution = institutionSeedToDomain(seed);
  const id = FirestoreInstitutionMapper.institutionDocId(institution);
  const data = FirestoreInstitutionMapper.toFirestore(institution);
  await getFirestore(getAdminApp()).collection(INSTITUTIONS_COLLECTION).doc(id).set(data, {
    merge: true,
  });
  console.log(`upserted ${INSTITUTIONS_COLLECTION}/${id} (${institution.name})`);
}

async function verifySignInCapable(spec: DemoAuthUserSpec): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.warn("skip Identity Toolkit sign-in check (NEXT_PUBLIC_FIREBASE_API_KEY missing)");
    return;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: spec.email,
        password: spec.password,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sign-in failed for ${spec.email}: ${response.status} ${text}`);
  }

  const json = (await response.json()) as { idToken?: string; localId?: string };
  if (!json.idToken || !json.localId) {
    throw new Error(`Sign-in response incomplete for ${spec.email}`);
  }

  const auth = getAuth(getAdminApp());
  const sessionCookie = await auth.createSessionCookie(json.idToken, {
    expiresIn: 60 * 60 * 1000,
  });
  const decoded = await auth.verifySessionCookie(sessionCookie, true);
  const role = typeof decoded.role === "string" ? decoded.role : "(none)";
  console.log(
    `verified ${spec.email}: uid=${decoded.sub} role=${role} emailVerified=${decoded.email_verified}`,
  );
}

async function main(): Promise<void> {
  console.log(`Seeding demo auth for project ${PROJECT_ID}…`);
  await upsertDemoOwnerInstitution();

  const uids = new Map<string, string>();

  for (const user of DEMO_AUTH_USERS) {
    const uid = await upsertAuthUser(user);
    uids.set(user.email, uid);
  }

  const ownerUid = uids.get("owner@eduatlas.dev");
  if (!ownerUid) {
    throw new Error("owner@eduatlas.dev was not created");
  }
  await upsertOwnerBinding(ownerUid, DEMO_OWNER_INSTITUTION_ID);

  console.log("\nVerifying authentication + session cookies…");
  for (const user of DEMO_AUTH_USERS) {
    await verifySignInCapable(user);
  }

  const binding = await getFirestore(getAdminApp())
    .collection(INSTITUTION_OWNERS_COLLECTION)
    .where("userId", "==", ownerUid)
    .where("status", "==", "approved")
    .limit(1)
    .get();

  if (binding.empty) {
    throw new Error("Owner binding verification failed — no approved institutionOwners doc");
  }
  const data = binding.docs[0]?.data();
  if (data?.institutionId !== DEMO_OWNER_INSTITUTION_ID) {
    throw new Error(
      `Owner binding institution mismatch: ${String(data?.institutionId)} !== ${DEMO_OWNER_INSTITUTION_ID}`,
    );
  }
  console.log(
    `\nOwner binding OK: ${ownerUid} → ${DEMO_OWNER_INSTITUTION_ID} (${binding.docs[0]?.id})`,
  );
  console.log("Demo auth seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
