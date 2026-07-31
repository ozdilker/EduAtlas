/**
 * Sort options for institution list / search (SEARCH-ARCHITECTURE).
 */
export enum InstitutionSort {
  Relevance = "relevance",
  NameAsc = "name",
  NameDesc = "name_desc",
}

const INSTITUTION_SORT_VALUES: ReadonlySet<string> = new Set(Object.values(InstitutionSort));

/**
 * Returns true when value is a known InstitutionSort.
 */
export function isInstitutionSort(value: string): value is InstitutionSort {
  return INSTITUTION_SORT_VALUES.has(value);
}

/**
 * Parses a raw sort string or falls back to relevance.
 */
export function parseInstitutionSort(raw: string | undefined): InstitutionSort {
  if (!raw) {
    return InstitutionSort.Relevance;
  }

  const value = raw.trim();

  if (!isInstitutionSort(value)) {
    throw new Error(`Unknown InstitutionSort: ${raw}`);
  }

  return value;
}
