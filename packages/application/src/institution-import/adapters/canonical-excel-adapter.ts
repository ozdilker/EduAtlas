import {
  CANONICAL_IMPORT_COLUMN_MAP,
  countMappedHeaders,
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
 * Canonical EduAtlas Excel adapter (.xls / .xlsx) using the standard column map.
 */
export class CanonicalExcelAdapter implements ImportDataSourceAdapter {
  readonly id = ImportDataSourceId.CanonicalExcel;

  matchScore(input: ImportAdapterMatchInput): number {
    if (
      input.sourceFormat !== ImportSourceFormat.Xlsx &&
      input.sourceFormat !== ImportSourceFormat.Xls
    ) {
      return 0;
    }
    const mapped = countMappedHeaders(input.headers, CANONICAL_IMPORT_COLUMN_MAP);
    // Prefer when canonical headers present; still a fallback under MEB.
    return mapped > 0 ? 20 + mapped : 5;
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
