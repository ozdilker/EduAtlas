import { getGeographyCatalogSummary, listCities, listDistricts } from "@eduatlas/application";
import { describe, expect, it } from "vitest";
import { createSeededGeographyRepositories } from "./seed-geography-collections";
import { buildTurkeyGeographySeedCatalog } from "./turkey-geography-seed";

describe("Türkiye geography catalog", () => {
  it("builds 81 cities and the full official district set", () => {
    const catalog = buildTurkeyGeographySeedCatalog();
    expect(catalog.cities).toHaveLength(81);
    expect(catalog.districts.length).toBe(973);

    const istanbul = catalog.cities.find((city) => city.slug === "istanbul");
    expect(istanbul?.plateCode).toBe("34");
    expect(istanbul?.isPriority).toBe(true);
    expect(istanbul?.statistics.institutionCount).toBe(0);
    expect(istanbul?.statistics.districtCount).toBeGreaterThan(30);

    const kadikoy = catalog.districts.find((district) => district.id.value === "istanbul-kadikoy");
    expect(kadikoy?.cityId.value).toBe("istanbul");
    expect(kadikoy?.statistics.publishedInstitutionCount).toBe(0);
  });

  it("supports listCities / listDistricts / search via repositories", async () => {
    const { cityRepository, districtRepository } = await createSeededGeographyRepositories();

    const cities = await listCities({}, { cityRepository });
    expect(cities).toHaveLength(81);

    const priority = await listCities({ isPriority: true }, { cityRepository });
    expect(priority.length).toBeGreaterThanOrEqual(8);

    const searched = await cityRepository.search("ankar");
    expect(searched.some((city) => city.slug === "ankara")).toBe(true);

    const bySlug = await cityRepository.getBySlug("izmir");
    expect(bySlug?.plateCode).toBe("35");

    const byPlate = await cityRepository.getByPlateCode("06");
    expect(byPlate?.slug).toBe("ankara");

    const districts = await listDistricts({ cityId: "istanbul" }, { districtRepository });
    expect(districts.length).toBeGreaterThan(30);

    const filtered = await listDistricts(
      { cityId: "istanbul", query: "kadikoy" },
      { districtRepository },
    );
    expect(filtered.some((district) => district.slug === "kadikoy")).toBe(true);

    const summary = await getGeographyCatalogSummary({ cityRepository, districtRepository });
    expect(summary.statistics.cityCount).toBe(81);
    expect(summary.statistics.districtCount).toBe(973);
    expect(summary.statistics.institutionCount).toBe(0);
    expect(summary.statistics.coverageNote).toMatch(/Geography-only/i);
  });
});
