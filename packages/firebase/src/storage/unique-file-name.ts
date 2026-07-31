/**
 * Builds a collision-resistant Storage object name from an original file name.
 */

function sanitizeExtension(extension: string): string {
  const cleaned = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned.slice(0, 12);
}

function extensionFromFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return "bin";
  }
  return sanitizeExtension(trimmed.slice(lastDot + 1)) || "bin";
}

function randomToken(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let index = 0; index < length; index += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "x";
  }
  return token;
}

/**
 * Returns `{timestamp36}_{random}.{ext}` derived from the original file name.
 */
export function createUniqueStorageFileName(originalFileName: string): string {
  const extension = extensionFromFileName(originalFileName);
  const stamp = Date.now().toString(36);
  return `${stamp}_${randomToken()}.${extension}`;
}

/**
 * Joins a directory and file name into a full Storage object path.
 */
export function joinStoragePath(directory: string, fileName: string): string {
  const dir = directory.trim().replace(/\/+$/g, "");
  const name = fileName.trim().replace(/^\/+/g, "");
  if (!dir) {
    throw new Error("Storage directory is required.");
  }
  if (!name) {
    throw new Error("Storage file name is required.");
  }
  return `${dir}/${name}`;
}
