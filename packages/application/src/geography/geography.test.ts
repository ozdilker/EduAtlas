import { createCity, createDistrict, GeoLifecycleStatus } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import type { CityRepository } from "./city-repository";
import type { DistrictRepository } from "./district-repository";
import { buildGeographyStatisticsPlaceholder, listCities, listDistricts } from "./index";

const timestamps = {
  createdAt: "2026-07-15T12:00:00.000Z",
  updatedAt: "2026-07-15T12:00:00.000Z",
};

function memoryRepos(): {
  cityRepository: CityRepository;
  districtRepository: DistrictRepository;
} {
  const cities = [
    createCity({
      nameTr: "Ankara",
      plateCode: "06",
      isPriority: true,
      districtCount: 1,
      ...timestamps,
    }),
    createCity({
      nameTr: "Yozgat",
      plateCode: "66",
      districtCount: 1,
      ...timestamps,
    }),
  ];
  const districts = [
    createDistrict({
      cityId: "ankara",
      citySlug: "ankara",
      nameTr: "Çankaya",
      ...timestamps,
    }),
    createDistrict({
      cityId: "yozgat",
      citySlug: "yozgat",
      nameTr: "Merkez",
      ...timestamps,
    }),
  ];

  return {
    cityRepository: {
      async getById(id) {
        return cities.find((city) => city.id.value === id) ?? null;
      },
      async getBySlug(slug) {
        return cities.find((city) => city.slug === slug) ?? null;
      },
      async getByPlateCode(plateCode) {
        return cities.find((city) => city.plateCode === plateCode.padStart(2, "0")) ?? null;
      },
      async list(options = {}) {
        let items = [...cities];
        if (options.isPriority !== undefined) {
          items = items.filter((city) => city.isPriority === options.isPriority);
        }
        if (options.query) {
          const q = options.query.toLowerCase();
          items = items.filter(
            (city) => city.slug.includes(q) || city.nameTr.toLowerCase().includes(q),
          );
        }
        return Object.freeze(items);
      },
      async search(query) {
        return this.list({ query });
      },
    },
    districtRepository: {
      async getById(id) {
        return districts.find((district) => district.id.value === id) ?? null;
      },
      async getBySlug(cityId, slug) {
        return (
          districts.find(
            (district) => district.cityId.value === cityId && district.slug === slug,
          ) ?? null
        );
      },
      async listByCityId(cityId, options = {}) {
        let items = districts.filter((district) => district.cityId.value === cityId);
        if (options.query) {
          const q = options.query.toLowerCase();
          items = items.filter((district) => district.slug.includes(q));
        }
        return Object.freeze(items);
      },
      async search(query, cityId) {
        if (cityId) {
          return this.listByCityId(cityId, { query });
        }
        return Object.freeze(
          districts.filter((district) => district.slug.includes(query.toLowerCase())),
        );
      },
    },
  };
}

describe("geography read services", () => {
  it("lists cities and districts through repository ports", async () => {
    const repos = memoryRepos();
    const cities = await listCities({ isPriority: true }, repos);
    expect(cities).toHaveLength(1);
    expect(cities[0]?.slug).toBe("ankara");

    const districts = await listDistricts({ cityId: "ankara" }, repos);
    expect(districts[0]?.slug).toBe("cankaya");
    expect(districts[0]?.lifecycleStatus).toBe(GeoLifecycleStatus.Published);
  });

  it("builds institution-zero statistics placeholders", () => {
    const stats = buildGeographyStatisticsPlaceholder({
      cityCount: 81,
      districtCount: 973,
      priorityCityCount: 10,
    });
    expect(stats.institutionCount).toBe(0);
    expect(stats.cityCount).toBe(81);
  });
});
