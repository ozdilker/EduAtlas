import { describe, expect, it } from "vitest";
import {
  createInstitutionAmenities,
  INSTITUTION_AMENITY_IDS,
  listInstitutionAmenityOptions,
} from "./institution-amenities";

describe("institution amenities", () => {
  it("keeps catalog order and drops unknowns/duplicates", () => {
    expect(
      createInstitutionAmenities(["gym", "unknown", "library", "gym", "shuttle"]),
    ).toEqual(["shuttle", "library", "gym"]);
  });

  it("returns empty when nothing selected", () => {
    expect(createInstitutionAmenities([])).toEqual([]);
    expect(createInstitutionAmenities(undefined)).toEqual([]);
  });

  it("builds checkbox options for the full catalog", () => {
    const options = listInstitutionAmenityOptions(["parking", "security"]);
    expect(options).toHaveLength(INSTITUTION_AMENITY_IDS.length);
    expect(options.find((item) => item.id === "parking")?.selected).toBe(true);
    expect(options.find((item) => item.id === "security")?.selected).toBe(true);
    expect(options.find((item) => item.id === "library")?.selected).toBe(false);
    expect(options.find((item) => item.id === "cafeteria")?.label).toBe("Yemekhane");
  });
});
