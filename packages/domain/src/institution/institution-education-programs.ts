/**
 * Institution education programs (multi-select, catalog-driven).
 * Extend by appending to INSTITUTION_EDUCATION_PROGRAM_IDS + labels.
 */

export const INSTITUTION_EDUCATION_PROGRAM_IDS = [
  "preschool",
  "primary",
  "middle_school",
  "lgs",
  "tyt",
  "ayt",
  "yks",
  "foreign_language",
  "robotics",
  "coding",
  "arts",
  "sports",
] as const;

export type InstitutionEducationProgramId = (typeof INSTITUTION_EDUCATION_PROGRAM_IDS)[number];

export const INSTITUTION_EDUCATION_PROGRAM_LABELS_TR: Readonly<
  Record<InstitutionEducationProgramId, string>
> = Object.freeze({
  preschool: "Okul Öncesi",
  primary: "İlkokul",
  middle_school: "Ortaokul",
  lgs: "LGS",
  tyt: "TYT",
  ayt: "AYT",
  yks: "YKS",
  foreign_language: "Yabancı Dil",
  robotics: "Robotik",
  coding: "Kodlama",
  arts: "Sanat",
  sports: "Spor",
});

/** Selected education program ids (stable catalog order). */
export type InstitutionEducationPrograms = readonly InstitutionEducationProgramId[];

export function isInstitutionEducationProgramId(
  value: string,
): value is InstitutionEducationProgramId {
  return (INSTITUTION_EDUCATION_PROGRAM_IDS as readonly string[]).includes(value);
}

/**
 * Normalizes a multi-select education programs list.
 * Unknown ids are dropped; duplicates removed; catalog order preserved.
 */
export function createInstitutionEducationPrograms(
  input: readonly string[] | undefined = [],
): InstitutionEducationPrograms {
  const selected = new Set(
    (input ?? [])
      .map((value) => value.trim())
      .filter((value) => isInstitutionEducationProgramId(value)),
  );

  const programs = INSTITUTION_EDUCATION_PROGRAM_IDS.filter((id) => selected.has(id));
  return Object.freeze(programs);
}

/**
 * Catalog entries for forms / UI (checkbox options).
 */
export function listInstitutionEducationProgramOptions(
  selected: readonly string[] | undefined = [],
): readonly Readonly<{ id: InstitutionEducationProgramId; label: string; selected: boolean }>[] {
  const selectedSet = new Set(createInstitutionEducationPrograms(selected));
  return Object.freeze(
    INSTITUTION_EDUCATION_PROGRAM_IDS.map((id) =>
      Object.freeze({
        id,
        label: INSTITUTION_EDUCATION_PROGRAM_LABELS_TR[id],
        selected: selectedSet.has(id),
      }),
    ),
  );
}
