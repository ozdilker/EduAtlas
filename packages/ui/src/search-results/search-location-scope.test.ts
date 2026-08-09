import { describe, expect, it } from "vitest";
import { buildSearchHref } from "./build-search-href";
import { findNearestCityId } from "../parent/turkey-city-centroids";

describe("search location scope helpers", () => {
  it("builds scoped free-text href with city only (no lat/lng)", () => {
    const href = buildSearchHref({ q: "anaokulu", city: "istanbul" });
    expect(href).toBe("/search?q=anaokulu&city=istanbul");
    expect(href).not.toMatch(/lat|lng|latitude|longitude/i);
  });

  it("builds scoped free-text href with city + district", () => {
    const href = buildSearchHref({
      q: "anaokulu",
      city: "istanbul",
      district: "istanbul-kadikoy",
    });
    expect(href).toBe("/search?q=anaokulu&city=istanbul&district=istanbul-kadikoy");
  });

  it("maps GPS-like coordinates to catalog cityId without network", () => {
    expect(findNearestCityId(41.01, 28.98)).toBe("istanbul");
    expect(findNearestCityId(39.93, 32.86)).toBe("ankara");
  });
});
