import {
  countMappedHeaders,
  ImportDataSourceId,
  ImportSourceFormat,
  MEB_IMPORT_COLUMN_MAP,
} from "@eduatlas/domain";
import type {
  ImportAdapterMatchInput,
  ImportAdapterParseInput,
  ImportAdapterParseResult,
  ImportDataSourceAdapter,
} from "./import-data-source-adapter";
import { mapTableToInstitutionImports } from "./map-table-to-imports";

/**
 * MEB Kurum Listesi Excel adapter — column mapping is central (MEB_IMPORT_COLUMN_MAP).
 */
export class MebExcelAdapter implements ImportDataSourceAdapter {
  readonly id = ImportDataSourceId.MebExcel;

  matchScore(input: ImportAdapterMatchInput): number {
    if (
      input.sourceFormat !== ImportSourceFormat.Xlsx &&
      input.sourceFormat !== ImportSourceFormat.Xls
    ) {
      return 0;
    }
    const mapped = countMappedHeaders(input.headers, MEB_IMPORT_COLUMN_MAP);
    // MEB fingerprint: İl / İlçe style headers without cityId/districtId.
    const joined = input.headers.map((h) => h.trim().toLocaleLowerCase("tr-TR")).join("|");
    const looksLikeMeb =
      joined.includes("il") ||
      joined.includes("ilçe") ||
      joined.includes("ilce") ||
      joined.includes("kurum");
    if (mapped === 0) {
      return 0;
    }
    return looksLikeMeb ? 40 + mapped : mapped;
  }

  parse(input: ImportAdapterParseInput): ImportAdapterParseResult {
    const mapped = mapTableToInstitutionImports(input.table, MEB_IMPORT_COLUMN_MAP);
    return Object.freeze({
      sourceId: this.id,
      rows: mapped.rows,
      unknownHeaders: mapped.unknownHeaders,
      columnMap: MEB_IMPORT_COLUMN_MAP,
    });
  }
}
