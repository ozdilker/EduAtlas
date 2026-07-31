import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const bucketName = "eduatlas-dev-media";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replaceAll("\\n", "\n"),
    }),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    storageBucket: bucketName,
  });
}

const bucket = getStorage().bucket(bucketName);
const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });
const bindings = policy.bindings ?? [];
const hasPublic = bindings.some(
  (b) =>
    b.role === "roles/storage.objectViewer" &&
    (b.members ?? []).includes("allUsers"),
);

if (!hasPublic) {
  bindings.push({
    role: "roles/storage.objectViewer",
    members: ["allUsers"],
  });
  await bucket.iam.setPolicy({ bindings });
  console.log("Added allUsers objectViewer");
} else {
  console.log("Public objectViewer already present");
}

const [meta] = await bucket.getMetadata();
console.log({
  name: meta.name,
  location: meta.location,
  uniformBucket:
    meta.iamConfiguration?.uniformBucketLevelAccess?.enabled ?? null,
});
