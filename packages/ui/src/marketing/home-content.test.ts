import { describe, expect, it } from "vitest";
import {
  getHomeHowItWorks,
  getHomeImpactStats,
  getHomePopularCities,
  getHomePopularSearches,
  getHomePopularTypes,
  getHomeStatistics,
  getHomeTrustBar,
  getHomeTrustIndicators,
} from "./home-content";

describe("homepage marketing content", () => {
  it("exposes popular institution types as static links", () => {
    const types = getHomePopularTypes();

    expect(types.length).toBeGreaterThanOrEqual(4);
    expect(types.every((item) => item.href.startsWith("/categories/"))).toBe(true);
  });

  it("exposes popular cities as static links", () => {
    const cities = getHomePopularCities();

    expect(cities.length).toBeGreaterThanOrEqual(4);
    expect(cities.every((item) => item.href.startsWith("/cities/"))).toBe(true);
  });

  it("exposes popular search chips", () => {
    expect(getHomePopularSearches().length).toBeGreaterThanOrEqual(3);
  });

  it("exposes presentation statistics without live metrics", () => {
    const stats = getHomeStatistics();

    expect(stats.map((item) => item.id)).toEqual(["institutions", "cities", "types", "families"]);
    expect(stats.every((item) => item.value.length > 0 && item.label.length > 0)).toBe(true);
  });

  it("exposes trust bar and trust indicators", () => {
    expect(getHomeTrustBar().length).toBeGreaterThanOrEqual(4);
    const trust = getHomeTrustIndicators();
    expect(trust).toHaveLength(4);
    expect(trust.every((item) => item.description.length > 0)).toBe(true);
  });

  it("exposes how-it-works and impact storytelling", () => {
    expect(getHomeHowItWorks()).toHaveLength(3);
    expect(getHomeImpactStats().length).toBeGreaterThanOrEqual(3);
  });
});
