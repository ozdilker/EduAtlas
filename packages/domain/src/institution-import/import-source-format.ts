/**
 * Supported institution import file formats.
 */
export enum ImportSourceFormat {
  Csv = "csv",
  Xlsx = "xlsx",
  Xls = "xls",
}

const FORMATS = new Set<string>(Object.values(ImportSourceFormat));

export function isImportSourceFormat(value: string): value is ImportSourceFormat {
  return FORMATS.has(value);
}

export function parseImportSourceFormat(value: string): ImportSourceFormat {
  if (!isImportSourceFormat(value)) {
    throw new Error(`Unknown ImportSourceFormat: ${value}`);
  }
  return value;
}

/**
 * Resolves the import format from a file name, or `null` when unsupported.
 */
export function importSourceFormatFromFileName(fileName: string): ImportSourceFormat | null {
  const lowered = fileName.trim().toLowerCase();
  if (lowered.endsWith(".csv")) {
    return ImportSourceFormat.Csv;
  }
  if (lowered.endsWith(".xlsx")) {
    return ImportSourceFormat.Xlsx;
  }
  if (lowered.endsWith(".xls")) {
    return ImportSourceFormat.Xls;
  }
  return null;
}
