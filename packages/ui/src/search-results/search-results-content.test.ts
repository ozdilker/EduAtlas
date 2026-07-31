import { describe, expect, it } from "vitest";
import {
  getStaticSearchRecommendations,
  getStaticSearchResultInstitutions,
  getStaticSearchResultsFilterChips,
  getStaticSearchResultsPagination,
  getStaticSearchResultsSortOptions,
  getStaticSearchResultsSummary,
} from "./search-results-content";

describe("search results static content", () => {
  it("exposes twelve static institution cards", () => {
    const institutions = getStaticSearchResultInstitutions();

    expect(institutions).toHaveLength(12);
    expect(institutions.every((item) => item.href.startsWith("/institutions/"))).toBe(true);
    expect(institutions.some((item) => (item.programLabels?.length ?? 0) > 0)).toBe(true);
  });

  it("exposes a static recommendation strip without changing ranking data", () => {
    const recommendations = getStaticSearchRecommendations();

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(3);
    expect(recommendations.every((item) => item.badges?.verified || item.badges?.premium)).toBe(
      true,
    );
  });

  it("exposes static summary, sort, filters, and pagination", () => {
    expect(getStaticSearchResultsSummary().resultCount).toBe(12);
    expect(getStaticSearchResultsSortOptions().some((item) => item.selected)).toBe(true);
    expect(getStaticSearchResultsFilterChips().length).toBeGreaterThanOrEqual(3);
    expect(getStaticSearchResultsPagination()).toEqual({
      currentPage: 1,
      totalPages: 5,
      pageNumbers: [1, 2, 3, 4, 5],
    });
  });
});
