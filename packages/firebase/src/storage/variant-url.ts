import type { InstitutionImageVariant } from "./path-builder";

const FIREBASE_STORAGE_V0_PATH_MATCHER = /\/o\/([^/]+)$/;

/**
 * Converts a Firebase Storage download URL pointing to an "original"
 * object into the matching URL for a derived image variant.
 *
 * Expected original object path shape (decoded):
 * - institutions/{institutionId}/{folder}/{fileName}
 *
 * Variant shape (decoded):
 * - institutions/{institutionId}/{folder}/{variant}/{fileName}
 */
export function resolveFirebaseStorageVariantUrl(input: {
  url?: string | null;
  variant: InstitutionImageVariant;
}): string | undefined {
  const url = input.url?.trim();
  if (!url) {
    return undefined;
  }

  // Only rewrite Firebase Storage v0 download URLs.
  if (!/^https?:\/\/[^/]*firebasestorage\.googleapis\.com\//i.test(url)) {
    return url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  // pathname: /v0/b/<bucket>/o/<encodedObjectPath>
  const match = parsed.pathname.match(FIREBASE_STORAGE_V0_PATH_MATCHER);
  const encodedObjectPath = match?.[1];
  if (!encodedObjectPath) {
    return url;
  }

  const decodedObjectPath = decodeURIComponent(encodedObjectPath);
  const parts = decodedObjectPath.split("/");

  // original expected: institutions/{id}/{folder}/{file}
  if (parts.length !== 4) {
    // If it's already in variant form, try returning it as-is.
    return url;
  }

  const [root, institutionId, folder, fileName] = parts;
  if (!root || !institutionId || !folder || !fileName) {
    return url;
  }

  const variantPath = `${root}/${institutionId}/${folder}/${input.variant}/${fileName}`;
  const nextEncoded = encodeURIComponent(variantPath);
  const nextUrl = url.replace(encodedObjectPath, nextEncoded);

  return nextUrl;
}

