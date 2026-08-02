/**
 * Compresses large import files before upload so they fit under Vercel's ~4.5MB
 * serverless request body limit (MEB city HTML exports are often 5–8MB raw).
 */
export async function prepareImportUploadFile(file: File): Promise<{
  uploadFile: File;
  contentEncoding: "gzip" | null;
}> {
  const THRESHOLD = 3_500_000;
  if (file.size < THRESHOLD || typeof CompressionStream === "undefined") {
    return { uploadFile: file, contentEncoding: null };
  }

  const compressed = await new Response(
    file.stream().pipeThrough(new CompressionStream("gzip")),
  ).blob();

  // If gzip somehow grew the payload, keep the original.
  if (compressed.size >= file.size) {
    return { uploadFile: file, contentEncoding: null };
  }

  const uploadFile = new File([compressed], `${file.name}.gz`, {
    type: "application/gzip",
  });
  return { uploadFile, contentEncoding: "gzip" };
}
