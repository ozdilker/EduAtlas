import { describe, expect, it } from "vitest";
import {
  findNearestCityId,
  haversineDistanceKm,
  TURKEY_CITY_CENTROIDS,
} from "./turkey-city-centroids";

describe("turkey city centroids", () => {
  it("computes haversine distance between nearby points", () => {
    const distance = haversineDistanceKm(41.0082, 28.9784, 41.015, 28.98);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(5);
  });

  it("resolves Istanbul coordinates to istanbul city id", () => {
    expect(findNearestCityId(41.01, 28.98)).toBe("istanbul");
  });

  it("resolves Ankara coordinates to ankara city id", () => {
    expect(findNearestCityId(39.93, 32.86)).toBe("ankara");
  });

  it("covers all 81 provinces", () => {
    expect(TURKEY_CITY_CENTROIDS).toHaveLength(81);
    const ids = new Set(TURKEY_CITY_CENTROIDS.map((city) => city.cityId));
    expect(ids.size).toBe(81);
  });

  it("returns null for invalid coordinates", () => {
    expect(findNearestCityId(Number.NaN, 30)).toBeNull();
  });
});
