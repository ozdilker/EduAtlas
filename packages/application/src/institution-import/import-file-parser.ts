import {
  type ImportDataSourceId,
  ImportSourceFormat,
  type InstitutionImport,
  importSourceFormatFromFileName,
  headerRowHasNameField,
  CANONICAL_IMPORT_COLUMN_MAP,
  MEB_IMPORT_COLUMN_MAP,
} from "@eduatlas/domain";
import type { ImportDataSourceAdapter } from "./adapters/import-data-source-adapter";
import { createDefaultImportAdapters, selectImportAdapter } from "./adapters/select-import-adapter";
import { parseCsvTable } from "./parsers/csv-table-parser";
import { decodeImportTextBytes } from "./parsers/decode-import-text";
import { detectImportHeaderRow } from "./parsers/detect-header-row";
import { parseExcelTable } from "./parsers/excel-table-parser";

/**
 * Raised when the uploaded file cannot be parsed into import rows.
 */
export class ImportFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportFileError";
  }
}

export function isImportFileError(error: unknown): error is ImportFileError {
  return error instanceof ImportFileError;
}

export type ParseImportFileInput = Readonly<{
  readonly fileName: string;
  readonly content: Uint8Array;
  /** Optional DI override for adapters (tests / future sources). */
  readonly adapters?: readonly ImportDataSourceAdapter[];
}>;

export type ParsedImportFile = Readonly<{
  readonly sourceFormat: ImportSourceFormat;
  readonly sourceId: ImportDataSourceId;
  readonly rows: readonly InstitutionImport[];
  /** Headers in the file that were not recognized by the selected adapter. */
  readonly unknownHeaders: readonly string[];
}>;

/**
 * Parses a CSV / XLSX / XLS file via the data-source adapter registry.
 * @throws {ImportFileError} for unsupported formats, missing headers, or unreadable files
 */
export async function parseImportFile(input: ParseImportFileInput): Promise<ParsedImportFile> {
  const sourceFormat = importSourceFormatFromFileName(input.fileName);

  if (!sourceFormat) {
    throw new ImportFileError("Sadece .csv, .xlsx ve .xls dosyaları destekleniyor.");
  }

  let matrix: string[][];
  try {
    matrix =
      sourceFormat === ImportSourceFormat.Csv
        ? parseCsvTable(decodeImportTextBytes(input.content))
        : parseExcelTable(input.content);
  } catch (error) {
    if (error instanceof ImportFileError) {
      throw error;
    }
    throw new ImportFileError(
      sourceFormat === ImportSourceFormat.Csv
        ? "CSV dosyası okunamadı."
        : "Excel dosyası okunamadı. Geçerli bir .xls veya .xlsx dosyası yükleyin.",
    );
  }

  if (matrix.length === 0) {
    throw new ImportFileError("Dosya boş: başlık satırı bulunamadı.");
  }

  const table = detectImportHeaderRow(matrix);
  if (!table) {
    throw new ImportFileError(
      'Başlık satırında "Kurum Adı" / "name" sütunu bulunamadı. MEB dosyalarında başlık satırı genelde üst bilgi satırlarının altındadır; dosyanın ilk sayfasında kurum adı kolonunun olduğundan emin olun.',
    );
  }

  const adapters = input.adapters ?? createDefaultImportAdapters();

  let adapter: ImportDataSourceAdapter;
  try {
    adapter = selectImportAdapter(adapters, {
      fileName: input.fileName,
      sourceFormat,
      headers: table.headers,
    });
  } catch (error) {
    throw new ImportFileError(
      error instanceof Error ? error.message : "Uygun adaptör bulunamadı.",
    );
  }

  const parsed = adapter.parse({
    fileName: input.fileName,
    sourceFormat,
    table,
  });

  const hasName =
    headerRowHasNameField(table.headers, MEB_IMPORT_COLUMN_MAP) ||
    headerRowHasNameField(table.headers, CANONICAL_IMPORT_COLUMN_MAP) ||
    parsed.rows.some((row) => Boolean(row.name.trim()));

  if (!hasName) {
    throw new ImportFileError(
      'Başlık satırında "Kurum Adı" / "name" sütunu bulunamadı. Tanınan örnekler: Kurum Adı, Kurumun Adı, Okul Adı, name, ad.',
    );
  }

  if (parsed.rows.length === 0) {
    throw new ImportFileError("Başlık bulundu ancak içe aktarılacak veri satırı yok.");
  }

  return Object.freeze({
    sourceFormat,
    sourceId: parsed.sourceId,
    rows: parsed.rows,
    unknownHeaders: parsed.unknownHeaders,
  });
}

export { parseCsvTable } from "./parsers/csv-table-parser";
