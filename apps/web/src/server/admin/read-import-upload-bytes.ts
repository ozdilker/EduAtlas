import { gunzipSync } from "node:zlib";

/**
 * Vercel serverless request bodies cap around 4.5MB.
 * MEB HTML-as-.xls city exports often exceed that — clients gzip before upload.
 */
export async function readImportUploadBytes(
  file: File,
  encodingHint?: string | null,
): Promise<Uint8Array> {
  const raw = new Uint8Array(await file.arrayBuffer());
  const encoding = (encodingHint ?? "").trim().toLowerCase();
  const looksGzip =
    encoding === "gzip" ||
    encoding === "application/gzip" ||
    (raw.length >= 2 && raw[0] === 0x1f && raw[1] === 0x8b);

  if (!looksGzip) {
    return raw;
  }

  try {
    return new Uint8Array(gunzipSync(raw));
  } catch {
    throw new Error("Sıkıştırılmış yükleme açılamadı. Dosyayı yeniden seçip deneyin.");
  }
}
