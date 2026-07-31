/**
 * Cloud Function: generate derived image variants on Storage upload.
 *
 * Folder convention (see `packages/firebase/src/storage/path-builder.ts`):
 * - Original: institutions/{institutionId}/{folder}/{fileName}
 * - Variant:  institutions/{institutionId}/{folder}/{variant}/{fileName}
 *
 * Variants:
 * - thumb_200
 * - small_400
 * - medium_800
 * - large_1200
 *
 * NOTE:
 * - This file is scaffolding for the plan. Wiring/deploy requires a Firebase Functions
 *   project setup (package.json, firebase.json functions config, env vars, dependencies).
 */

import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as admin from "firebase-admin";
import sharp from "sharp";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

type Variant = { kind: "thumb_200" | "small_400" | "medium_800" | "large_1200"; width: number };

const VARIANTS: readonly Variant[] = [
  { kind: "thumb_200", width: 200 },
  { kind: "small_400", width: 400 },
  { kind: "medium_800", width: 800 },
  { kind: "large_1200", width: 1200 },
];

// Trigger only for original uploads in our known folders.
// Example original object name:
// institutions/{institutionId}/logo/{fileName}
export const resizeImage = onObjectFinalized(async (event) => {
    const object = event.data;
    const objectName = object?.name;
    const bucketName = object?.bucket;

    if (!objectName || !bucketName) {
      return;
    }

    // Skip variant uploads to avoid infinite recursion.
    if (
      objectName.includes("/thumb_200/") ||
      objectName.includes("/small_400/") ||
      objectName.includes("/medium_800/") ||
      objectName.includes("/large_1200/")
    ) {
      return;
    }

    const parts = objectName.split("/");
    // Expected: institutions/{institutionId}/{folder}/{fileName}
    if (parts.length < 4) {
      return;
    }
    const [root, institutionId, folder, fileName] = parts;
    if (root !== "institutions" || !institutionId || !folder || !fileName) {
      return;
    }

    if (!["logo", "cover", "gallery"].includes(folder)) {
      return;
    }

    const bucket = admin.storage().bucket(bucketName);
    const original = bucket.file(objectName);

    const [buf] = await original.download();

    // Detect format to keep output type stable (defaults to jpg).
    const contentType = original.metadata?.contentType ?? "image/jpeg";
    const outputFormat = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpeg";

    for (const variant of VARIANTS) {
      const variantObjectName = `institutions/${institutionId}/${folder}/${variant.kind}/${fileName}`;
      const target = bucket.file(variantObjectName);

      // Resize strategy: cover-crop to keep visual aspect under fixed width.
      const resized = await sharp(buf)
        .resize({ width: variant.width, withoutEnlargement: true, fit: "cover" })
        .toFormat(outputFormat as never);

      await target.save(resized, {
        contentType,
        public: true,
      });
    }
});

