import type {
  ImportColumnMap,
  ImportDataSourceId,
  ImportSourceFormat,
  InstitutionImport,
} from "@eduatlas/domain";

/**
 * Raw rectangular table extracted from a file (header + data rows).
 */
export type ImportRawTable = Readonly<{
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}>;

export type ImportAdapterMatchInput = Readonly<{
  readonly fileName: string;
  readonly sourceFormat: ImportSourceFormat;
  readonly headers: readonly string[];
}>;

export type ImportAdapterParseInput = Readonly<{
  readonly fileName: string;
  readonly sourceFormat: ImportSourceFormat;
  readonly table: ImportRawTable;
}>;

export type ImportAdapterParseResult = Readonly<{
  readonly sourceId: ImportDataSourceId;
  readonly rows: readonly InstitutionImport[];
  readonly unknownHeaders: readonly string[];
  readonly columnMap: ImportColumnMap;
}>;

/**
 * Data-source adapter contract — Importer never knows MEB/CSV/YÖK specifics.
 * New sources = new adapter implementing this interface (Open/Closed).
 */
export interface ImportDataSourceAdapter {
  readonly id: ImportDataSourceId;
  /**
   * Higher score wins adapter selection. Return 0 when unsupported.
   */
  matchScore(input: ImportAdapterMatchInput): number;
  parse(input: ImportAdapterParseInput): ImportAdapterParseResult;
}
