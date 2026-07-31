import { describe, expect, it } from "vitest";
import { createSeededInstitutionRepository } from "./create-seeded-institution-repository";
import { resolveGeoLabels } from "./geo-catalog";
import { INSTITUTION_SEED_DATASET } from "./institution-seeds";

describe("geo catalog from seeds", () => {
  it("resolves known seed city and district labels", () => {
    const geo = resolveGeoLabels("city_istanbul", "dist_kadikoy");
    expect(geo.cityName).toBe("İstanbul");
    expect(geo.citySlug).toBe("istanbul");
    expect(geo.districtName).toBe("Kadıköy");
    expect(geo.districtSlug).toBe("kadikoy");
  });
});

describe("createSeededInstitutionRepository", () => {
  it("loads seed dataset so repository can read by slug", async () => {
    const repository = await createSeededInstitutionRepository();
    const institution = await repository.getBySlug("kadikoy-marmara-koleji");

    expect(institution?.name).toBe("Kadıköy Marmara Koleji");
    expect(INSTITUTION_SEED_DATASET.length).toBeGreaterThanOrEqual(20);

    const listed = await repository.list({ page: 1, pageSize: 50 });
    expect(listed.totalItems).toBe(INSTITUTION_SEED_DATASET.length);
  });
});
