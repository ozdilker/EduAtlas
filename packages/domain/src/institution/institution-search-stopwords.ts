/**
 * Folded institution search stopwords (single source of truth).
 * Compare only after foldTurkishText.
 */
export const INSTITUTION_SEARCH_STOPWORDS: ReadonlySet<string> = Object.freeze(
  new Set([
    "ozel",
    "ogretim",
    "kursu",
    "kurs",
    "akademi",
    "mah",
    "cad",
    "sk",
    "no",
    "okul",
    "okulu",
    "kolej",
    "koleji",
    "anadolu",
    "lisesi",
    "lise",
    "merkezi",
    "merkez",
    "ve",
    "the",
    "ic",
    "kapi",
    "diger",
    "kapilar",
    "blok",
  ]),
);

export function isFoldedInstitutionSearchStopword(token: string): boolean {
  return INSTITUTION_SEARCH_STOPWORDS.has(token);
}
