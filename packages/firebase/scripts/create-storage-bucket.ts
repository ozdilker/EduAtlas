import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replaceAll("\\n", "\n");

const candidates = [
  `${projectId}.appspot.com`,
  `${projectId}-media`,
  `${projectId}-uploads`,
];

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const storage = getStorage();

for (const name of candidates) {
  const [exists] = await storage.bucket(name).exists();
  console.log(`check ${name}: exists=${exists}`);
  if (exists) {
    console.log(`USING_EXISTING=${name}`);
    process.exit(0);
  }
}

for (const name of candidates) {
  try {
    console.log(`creating ${name}...`);
    const [bucket] = await storage.bucket(name).create({
      location: "EUROPE-WEST3",
      storageClass: "STANDARD",
      iamConfiguration: {
        uniformBucketLevelAccess: { enabled: true },
      },
    });
    console.log(`CREATED=${bucket.name}`);
    process.exit(0);
  } catch (error) {
    console.log(`fail ${name}:`, error instanceof Error ? error.message : error);
  }
}

console.error("No bucket could be created");
process.exit(1);
