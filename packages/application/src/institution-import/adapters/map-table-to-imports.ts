import {
  createInstitutionImport,
  foldTurkishText,
  IGNORED_IMPORT_HEADERS,
  type ImportColumnMap,
  type InstitutionImport,
  type InstitutionImportField,
  resolveMappedImportField,
} from "@eduatlas/domain";
import type { ImportRawTable } from "./import-data-source-adapter";

/**
 * Maps a raw table through a central column map into InstitutionImport rows.
 */
export function mapTableToInstitutionImports(
  table: ImportRawTable,
  columnMap: ImportColumnMap,
): Readonly<{
  rows: readonly InstitutionImport[];
  unknownHeaders: readonly string[];
}> {
  const columns: Array<InstitutionImportField | null> = [];
  const unknownHeaders: string[] = [];

  for (const header of table.headers) {
    const trimmed = header.trim();
    if (!trimmed) {
      columns.push(null);
      continue;
    }
    const field = resolveMappedImportField(trimmed, columnMap);
    columns.push(field);
    const folded = foldTurkishText(trimmed.replaceAll(/[\r\n]+/g, " "));
    if (!field && !IGNORED_IMPORT_HEADERS.has(folded)) {
      unknownHeaders.push(trimmed);
    }
  }

  const rows: InstitutionImport[] = [];
  table.rows.forEach((cells, index) => {
    if (cells.every((cell) => !String(cell).trim())) {
      return;
    }
    const values: Partial<Record<InstitutionImportField, string>> = {};
    columns.forEach((field, columnIndex) => {
      if (!field) {
        return;
      }
      const next = String(cells[columnIndex] ?? "").trim();
      const previous = values[field]?.trim() ?? "";
      // Prefer the first meaningful cell; never let a numeric MEB code overwrite a type name.
      if (!previous) {
        values[field] = String(cells[columnIndex] ?? "");
        return;
      }
      if (/^\d+$/.test(previous) && next && !/^\d+$/.test(next)) {
        values[field] = String(cells[columnIndex] ?? "");
      }
    });
    rows.push(createInstitutionImport({ rowNumber: index + 1, values }));
  });

  return {
    rows: Object.freeze(rows),
    unknownHeaders: Object.freeze(unknownHeaders),
  };
}
