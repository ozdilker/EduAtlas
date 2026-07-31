import {
  CANONICAL_IMPORT_COLUMN_MAP,
  countMappedHeaders,
  headerRowHasNameField,
  type ImportColumnMap,
  MEB_IMPORT_COLUMN_MAP,
} from "@eduatlas/domain";
import type { ImportRawTable } from "../adapters/import-data-source-adapter";

const HEADER_SCAN_LIMIT = 40;

/**
 * Scores a candidate header row for adapter fingerprinting.
 */
export function scoreHeaderRow(headers: readonly string[], columnMap: ImportColumnMap): number {
  const mapped = countMappedHeaders(headers, columnMap);
  if (mapped === 0) {
    return 0;
  }
  const hasName = headerRowHasNameField(headers, columnMap) ? 25 : 0;
  return mapped + hasName;
}

/**
 * Finds the best header row in a raw matrix (MEB exports often have title rows above headers).
 * Returns null when no usable header is found.
 */
export function detectImportHeaderRow(
  matrix: readonly (readonly string[])[],
): ImportRawTable | null {
  let bestIndex = -1;
  let bestScore = 0;

  const limit = Math.min(matrix.length, HEADER_SCAN_LIMIT);
  for (let index = 0; index < limit; index += 1) {
    const headers = matrix[index] ?? [];
    const mebScore = scoreHeaderRow(headers, MEB_IMPORT_COLUMN_MAP);
    const canonicalScore = scoreHeaderRow(headers, CANONICAL_IMPORT_COLUMN_MAP);
    const score = Math.max(mebScore, canonicalScore);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  if (bestIndex < 0 || bestScore < 25) {
    // Require at least a mapped name field (25) so title rows don't win.
    return null;
  }

  const headers = matrix[bestIndex] ?? [];
  const rows = matrix.slice(bestIndex + 1);
  return Object.freeze({
    headers: Object.freeze([...headers]),
    rows: Object.freeze(rows.map((row) => Object.freeze([...row]))),
  });
}
