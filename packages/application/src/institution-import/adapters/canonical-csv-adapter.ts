import {
  CANONICAL_IMPORT_COLUMN_MAP,
  ImportDataSourceId,
  ImportSourceFormat,
} from "@eduatlas/domain";
import type {
  ImportAdapterMatchInput,
  ImportAdapterParseInput,
  ImportAdapterParseResult,
  ImportDataSourceAdapter,
} from "./import-data-source-adapter";
import { mapTableToInstitutionImports } from "./map-table-to-imports";

/**
 * Canonical EduAtlas CSV adapter (backward-compatible template format).
 */
export class CanonicalCsvAdapter implements ImportDataSourceAdapter {
  readonly id = ImportDataSourceId.CanonicalCsv;

  matchScore(input: ImportAdapterMatchInput): number {
    if (input.sourceFormat !== ImportSourceFormat.Csv) {
      return 0;
    }
    return 10;
  }

  parse(input: ImportAdapterParseInput): ImportAdapterParseResult {
    const mapped = mapTableToInstitutionImports(input.table, CANONICAL_IMPORT_COLUMN_MAP);
    return Object.freeze({
      sourceId: this.id,
      rows: mapped.rows,
      unknownHeaders: mapped.unknownHeaders,
      columnMap: CANONICAL_IMPORT_COLUMN_MAP,
    });
  }
}
