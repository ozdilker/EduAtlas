import { describe, expect, it } from "vitest";
import { buildSearchHref, toSearchHrefParams } from "./build-search-href";
import type { SearchFiltersViewModel } from "./build-search-href";

const sampleFilters: SearchFiltersViewModel = {
  cities: [{ id: "city_istanbul", label: "İstanbul" }],
  districts: [{ id: "dist_kadikoy", label: "Kadıköy" }],
  types: [{ id: "kindergarten", label: "Anaokulu" }],
  active: {
    cityId: "city_istanbul",
    type: "kindergarten",
    verified: true,
  },
  query: "anaokulu",
  sort: "name",
};

describe("buildSearchHref", () => {
  it("builds query strings from filter state", () => {
    expect(buildSearchHref(toSearchHrefParams(sampleFilters))).toBe(
      "/search?q=anaokulu&city=city_istanbul&type=kindergarten&verified=1&sort=name",
    );
  });

  it("clears type when override is null", () => {
    expect(buildSearchHref(toSearchHrefParams(sampleFilters, { type: null, page: 1 }))).toBe(
      "/search?q=anaokulu&city=city_istanbul&verified=1&sort=name",
    );
  });
});
