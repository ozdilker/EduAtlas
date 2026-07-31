import type { ImportDataSourceAdapter } from "./import-data-source-adapter";
import { CanonicalCsvAdapter } from "./canonical-csv-adapter";
import { CanonicalExcelAdapter } from "./canonical-excel-adapter";
import { MebExcelAdapter } from "./meb-excel-adapter";

/**
 * Default adapter registry. Inject a custom list in tests / future DI.
 */
export function createDefaultImportAdapters(): readonly ImportDataSourceAdapter[] {
  return Object.freeze([
    new CanonicalCsvAdapter(),
    new MebExcelAdapter(),
    new CanonicalExcelAdapter(),
  ]);
}

/**
 * Picks the highest-scoring adapter for the file fingerprint.
 */
export function selectImportAdapter(
  adapters: readonly ImportDataSourceAdapter[],
  input: Parameters<ImportDataSourceAdapter["matchScore"]>[0],
): ImportDataSourceAdapter {
  let best: ImportDataSourceAdapter | null = null;
  let bestScore = 0;

  for (const adapter of adapters) {
    const score = adapter.matchScore(input);
    if (score > bestScore) {
      best = adapter;
      bestScore = score;
    }
  }

  if (!best || bestScore <= 0) {
    throw new Error("Bu dosya için uygun bir içe aktarma adaptörü bulunamadı.");
  }

  return best;
}
