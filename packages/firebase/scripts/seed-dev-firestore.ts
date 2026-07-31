/**
 * Development seed script for Cloud Firestore (eduatlas-dev).
 * Uses the Firebase client SDK; rules must temporarily allow writes during seeding.
 *
 * Usage (from repo root, with open write rules):
 *   npx tsx packages/firebase/scripts/seed-dev-firestore.ts
 */
import { initializeApp } from "firebase/app";
import { collection, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";
import { INSTITUTIONS_COLLECTION } from "../src/institutions/firestore-institution-document";
import { FirestoreInstitutionMapper } from "../src/institutions/firestore-institution-mapper";
import { institutionSeedToDomain, loadInstitutionSeedDataset } from "../src/seeds/seed-loader";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "eduatlas-dev";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is required to seed Firestore.");
}

const app = initializeApp({
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

async function main(): Promise<void> {
  const seeds = loadInstitutionSeedDataset();
  let written = 0;

  for (const seed of seeds) {
    const institution = institutionSeedToDomain(seed);
    const id = FirestoreInstitutionMapper.institutionDocId(institution);
    const data = FirestoreInstitutionMapper.toFirestore(institution);
    await setDoc(doc(db, INSTITUTIONS_COLLECTION, id), data);
    written += 1;
  }

  const snapshot = await getDocs(collection(db, INSTITUTIONS_COLLECTION));
  console.log(
    JSON.stringify(
      {
        written,
        totalDocuments: snapshot.size,
        projectId,
        collection: INSTITUTIONS_COLLECTION,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
