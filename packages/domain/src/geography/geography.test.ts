import { describe, expect, it } from "vitest";
import { createCity, createDistrict, GeoLifecycleStatus, slugifyGeographyName } from "./index";

const timestamps = {
  createdAt: "2026-07-15T10:00:00.000Z",
  updatedAt: "2026-07-15T10:00:00.000Z",
};

describe("geography catalog", () => {
  it("creates cities with plate codes, slugs, and zeroed stats placeholders", () => {
    const city = createCity({
      nameTr: "İstanbul",
      plateCode: "34",
      isPriority: true,
      districtCount: 39,
      ...timestamps,
    });

    expect(city.slug).toBe("istanbul");
    expect(city.id.value).toBe("istanbul");
    expect(city.plateCode).toBe("34");
    expect(city.lifecycleStatus).toBe(GeoLifecycleStatus.Published);
    expect(city.statistics.institutionCount).toBe(0);
    expect(city.statistics.districtCount).toBe(39);
    expect(Object.isFrozen(city)).toBe(true);
  });

  it("creates districts bound to a city with globally unique ids", () => {
    const district = createDistrict({
      cityId: "istanbul",
      citySlug: "istanbul",
      nameTr: "Kadıköy",
      ...timestamps,
    });

    expect(district.slug).toBe("kadikoy");
    expect(district.id.value).toBe("istanbul-kadikoy");
    expect(district.cityId.value).toBe("istanbul");
    expect(district.statistics.publishedInstitutionCount).toBe(0);
  });

  it("slugifies Turkish geography names", () => {
    expect(slugifyGeographyName("Çanakkale")).toBe("canakkale");
    expect(slugifyGeographyName("Şişli")).toBe("sisli");
  });
});
