import { createRequire } from "node:module";
import * as XLSX from "xlsx";

let ready = false;

/**
 * Loads SheetJS codepage tables (required by ESM builds for legacy .xls).
 * Safe no-op when the CJS build already bundled cpexcel.
 */
export function ensureSheetJsCodepage(): void {
  if (ready) {
    return;
  }
  ready = true;

  const setCptable = (XLSX as { set_cptable?: (table: unknown) => void }).set_cptable;
  if (typeof setCptable !== "function") {
    return;
  }

  try {
    const require = createRequire(import.meta.url);
    setCptable(require("xlsx/dist/cpexcel.js"));
  } catch {
    // Encoding support remains best-effort when the optional module is unavailable.
  }
}
