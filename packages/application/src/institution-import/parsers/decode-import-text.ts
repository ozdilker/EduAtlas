const REPLACEMENT = "\uFFFD";

const CANDIDATE_ENCODINGS = [
  "utf-8",
  "windows-1254",
  "iso-8859-9",
] as const;

type CandidateEncoding = (typeof CANDIDATE_ENCODINGS)[number];

/**
 * Scores a decoded string for Turkish institutional import files.
 * Fewer replacement chars and more Turkish letters win.
 */
function scoreDecodedText(text: string): number {
  const replacements = text.split(REPLACEMENT).length - 1;
  const turkish = (text.match(/[İıŞşĞğÜüÖöÇç]/g) ?? []).length;
  return turkish * 3 - replacements * 25;
}

function decodeWith(label: CandidateEncoding, bytes: Uint8Array): string {
  return new TextDecoder(label, { fatal: false }).decode(bytes);
}

function charsetFromMeta(sampleAscii: string): CandidateEncoding | null {
  const match = sampleAscii.match(/charset\s*=\s*["']?\s*([a-zA-Z0-9_-]+)/i);
  if (!match?.[1]) {
    return null;
  }
  const raw = match[1].toLowerCase();
  if (raw === "utf-8" || raw === "utf8") {
    return "utf-8";
  }
  if (raw === "windows-1254" || raw === "x-cp1254" || raw === "cp1254") {
    return "windows-1254";
  }
  if (raw === "iso-8859-9" || raw === "latin5" || raw === "iso_8859-9") {
    return "iso-8859-9";
  }
  return null;
}

/**
 * Decodes import file bytes, preferring UTF-8 then Turkish Windows encodings.
 * Fixes MEB HTML/.xls and CSV exports that use Windows-1254.
 */
export function decodeImportTextBytes(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return decodeWith("utf-8", bytes.subarray(3));
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }

  const headAscii = decodeWith("utf-8", bytes.subarray(0, Math.min(bytes.length, 512)));
  const hinted = charsetFromMeta(headAscii);

  // Large MEB HTML exports: honor the meta charset and skip scoring all encodings
  // (each full decode can hold a multi‑MB UTF-16 string in memory).
  if (hinted && bytes.length >= 512_000) {
    return decodeWith(hinted, bytes);
  }

  const candidates: CandidateEncoding[] = hinted
    ? [hinted, ...CANDIDATE_ENCODINGS.filter((item) => item !== hinted)]
    : [...CANDIDATE_ENCODINGS];

  let bestText = decodeWith(candidates[0] ?? "utf-8", bytes);
  let bestScore = scoreDecodedText(bestText);

  for (const encoding of candidates.slice(1)) {
    const text = decodeWith(encoding, bytes);
    const score = scoreDecodedText(text);
    if (score > bestScore) {
      bestScore = score;
      bestText = text;
    }
  }

  return bestText;
}

/**
 * True when bytes look like OLE Compound File (.xls binary).
 */
export function isOleCompoundFile(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  );
}

/**
 * True when bytes look like a ZIP package (.xlsx).
 */
export function isZipPackage(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

/**
 * True when content is HTML / SpreadsheetML / plaintext masquerading as Excel
 * (common for MEB "Kurum Listesi" downloads).
 */
export function isTextSpreadsheetPayload(bytes: Uint8Array): boolean {
  if (isOleCompoundFile(bytes) || isZipPackage(bytes)) {
    return false;
  }
  const sample = decodeImportTextBytes(bytes.subarray(0, Math.min(bytes.length, 2048)))
    .trimStart()
    .toLowerCase();
  return (
    sample.startsWith("<html") ||
    sample.startsWith("<!doctype html") ||
    sample.startsWith("<table") ||
    sample.startsWith("<?xml") ||
    sample.startsWith("<workbook") ||
    sample.startsWith("<ss:workbook")
  );
}
