import * as XLSX from "xlsx";
import {
  decodeImportTextBytes,
  isOleCompoundFile,
  isTextSpreadsheetPayload,
  isZipPackage,
} from "./decode-import-text";
import { ensureSheetJsCodepage } from "./sheetjs-runtime";

/**
 * Reads legacy .xls and modern .xlsx into a string table (first sheet).
 * Handles MEB HTML-as-.xls exports and Windows-1254 Turkish encodings.
 */
export function parseExcelTable(content: Uint8Array): string[][] {
  ensureSheetJsCodepage();

  const workbook = isTextSpreadsheetPayload(content)
    ? XLSX.read(decodeImportTextBytes(content), {
        type: "string",
        cellDates: false,
        cellNF: false,
        cellText: true,
        codepage: 1254,
      })
    : XLSX.read(content, {
        type: "array",
        cellDates: false,
        cellNF: false,
        cellText: true,
        // Turkish legacy BIFF without CodePage record (MEB / older Excel).
        codepage: isOleCompoundFile(content) || !isZipPackage(content) ? 1254 : undefined,
      });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Excel dosyasında çalışma sayfası bulunamadı.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error("Excel çalışma sayfası okunamadı.");
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  return matrix
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((cell) => cell !== ""));
}
