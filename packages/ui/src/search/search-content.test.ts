import { describe, expect, it } from "vitest";
import {
  getSearchBarClassName,
  getSearchContainerClassName,
  getSearchStatusClassName,
} from "./search-classes";
import {
  getSearchFilterPlaceholders,
  getGenericInstitutionSearchHint,
  getSearchStatusMessage,
  getStaticSearchSuggestions,
} from "./search-content";

describe("search content helpers", () => {
  it("exposes static suggestions without live search data", () => {
    const suggestions = getStaticSearchSuggestions();

    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    expect(suggestions.every((item) => item.id && item.label)).toBe(true);
  });

  it("exposes collapsed filter placeholders", () => {
    const filters = getSearchFilterPlaceholders();

    expect(filters.map((item) => item.id)).toEqual(["city", "district", "type"]);
  });

  it("maps visual status messages", () => {
    expect(getSearchStatusMessage("idle")).toBeNull();
    expect(getSearchStatusMessage("loading")).toContain("yükleniyor");
    expect(getSearchStatusMessage("empty")).toContain("Sonuç");
    expect(getSearchStatusMessage("error")).toContain("kullanılamıyor");
    expect(getGenericInstitutionSearchHint()).toContain("spesifik bir kurum adı");
  });
});

describe("search class helpers", () => {
  it("builds search bar variant classes", () => {
    expect(getSearchBarClassName({ variant: "hero" })).toBe("ea-search-bar ea-search-bar--hero");
    expect(getSearchBarClassName({ variant: "header" })).toContain("ea-search-bar--header");
  });

  it("builds container and status classes", () => {
    expect(getSearchContainerClassName({ status: "loading" })).toBe(
      "ea-search-container ea-search-container--loading",
    );
    expect(getSearchStatusClassName({ status: "error" })).toBe(
      "ea-search-status ea-search-status--error",
    );
  });
});
