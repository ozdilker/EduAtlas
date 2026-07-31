import { getObjectStorage } from "../media/repository";

export type OwnerInstitutionObjectFolder =
  | "logo"
  | "cover"
  | "gallery"
  | "documents"
  | "videos";

export type OwnerInstitutionObjectPutResult = {
  path: string;
  downloadUrl: string;
};

function createUniqueFileName(originalFileName: string): string {
  const trimmed = originalFileName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const extension =
    lastDot > 0 && lastDot < trimmed.length - 1
      ? trimmed
          .slice(lastDot + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 12) || "bin"
      : "bin";
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let index = 0; index < 8; index += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "x";
  }
  return `${Date.now().toString(36)}_${token}.${extension}`;
}

/**
 * Extracts a Storage object path from Firebase or GCS download URLs.
 */
export function storagePathFromDownloadUrl(downloadUrl: string): string | undefined {
  const trimmed = downloadUrl.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);

    const firebaseMatch = url.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)$/);
    if (firebaseMatch?.[1]) {
      return decodeURIComponent(firebaseMatch[1]);
    }

    if (url.hostname === "storage.googleapis.com") {
      const segments = url.pathname.replace(/^\/+/, "").split("/");
      if (segments.length >= 2) {
        return decodeURIComponent(segments.slice(1).join("/"));
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/**
 * Uploads an owner institution object via Admin ObjectStorage (session-auth path).
 * Avoids the browser Firebase client SDK, which has no Auth session in this app.
 */
export async function putOwnerInstitutionObject(input: {
  institutionId: string;
  folder: OwnerInstitutionObjectFolder;
  fileName: string;
  contentType: string;
  data: Uint8Array;
}): Promise<OwnerInstitutionObjectPutResult> {
  const fileName = createUniqueFileName(input.fileName);
  const path = `institutions/${input.institutionId.trim()}/${input.folder}/${fileName}`;
  const objectStorage = await getObjectStorage();

  try {
    const put = await objectStorage.put({
      path,
      contentType: input.contentType,
      data: input.data,
      publicReadable: true,
    });

    return {
      path: put.path,
      downloadUrl: put.url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/bucket does not exist/i.test(message) || /accountDisabled|billing/i.test(message)) {
      throw new Error(
        "Dosya depolama alanı hazır değil. Firebase’de Cloud Storage’ı (Blaze) etkinleştirin veya geliştirme için EDUATLAS_LOCAL_OBJECT_STORAGE=true kullanın.",
      );
    }
    throw error instanceof Error ? error : new Error("Dosya yükleme başarısız oldu.");
  }
}

/**
 * Best-effort delete by download URL (Firebase or GCS public URL shapes).
 */
export async function deleteOwnerInstitutionObjectByUrl(downloadUrl: string): Promise<void> {
  const path = storagePathFromDownloadUrl(downloadUrl);
  if (!path) {
    return;
  }
  const objectStorage = await getObjectStorage();
  await objectStorage.delete(path);
}

/**
 * Best-effort delete by Storage object path.
 */
export async function deleteOwnerInstitutionObjectByPath(path: string | undefined): Promise<void> {
  const trimmed = path?.trim();
  if (!trimmed) {
    return;
  }
  const objectStorage = await getObjectStorage();
  await objectStorage.delete(trimmed);
}
