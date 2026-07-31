import { describe, expect, it } from "vitest";
import {
  createInstitutionEducationPrograms,
  INSTITUTION_EDUCATION_PROGRAM_IDS,
  listInstitutionEducationProgramOptions,
} from "./institution-education-programs";

describe("institution education programs", () => {
  it("keeps catalog order and drops unknowns/duplicates", () => {
    expect(
      createInstitutionEducationPrograms(["yks", "unknown", "lgs", "yks", "preschool"]),
    ).toEqual(["preschool", "lgs", "yks"]);
  });

  it("returns empty when nothing selected", () => {
    expect(createInstitutionEducationPrograms([])).toEqual([]);
    expect(createInstitutionEducationPrograms(undefined)).toEqual([]);
  });

  it("builds checkbox options for the full catalog", () => {
    const options = listInstitutionEducationProgramOptions(["coding", "sports"]);
    expect(options).toHaveLength(INSTITUTION_EDUCATION_PROGRAM_IDS.length);
    expect(options.find((item) => item.id === "coding")?.selected).toBe(true);
    expect(options.find((item) => item.id === "sports")?.selected).toBe(true);
    expect(options.find((item) => item.id === "tyt")?.selected).toBe(false);
    expect(options.find((item) => item.id === "foreign_language")?.label).toBe("Yabancı Dil");
  });
});
