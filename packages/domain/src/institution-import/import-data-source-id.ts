/**
 * Identifiers for import data-source adapters (Open/Closed: add ids without changing importers).
 */
export enum ImportDataSourceId {
  CanonicalCsv = "canonical_csv",
  CanonicalExcel = "canonical_excel",
  MebExcel = "meb_excel",
  /** Reserved stubs for future adapters — not registered yet. */
  Yok = "yok",
  GoogleMaps = "google_maps",
  GoogleBusiness = "google_business",
  InstitutionSubmission = "institution_submission",
  FutureApi = "future_api",
}

const IDS = new Set<string>(Object.values(ImportDataSourceId));

export function isImportDataSourceId(value: string): value is ImportDataSourceId {
  return IDS.has(value);
}
