import { describe, expect, it } from "vitest";
import { getStaticCategoryLanding } from "./category-landing-content";

describe("category landing static content", () => {
  it("exposes dershane hub data under /categories paths", () => {
    const category = getStaticCategoryLanding("dershane");

    expect(category.slug).toBe("dershane");
    expect(category.name).toBe("Dershane");
    expect(category.title).toContain("Dershane");
    expect(category.breadcrumbs.at(-1)?.label).toBe("Dershane");
    expect(category.popularCities.every((item) => item.href.includes("/types/dershane"))).toBe(
      true,
    );
  });

  it("includes related categories, guide, and faqs", () => {
    const category = getStaticCategoryLanding("dershane");

    expect(category.relatedCategories.every((item) => item.href.startsWith("/categories/"))).toBe(
      true,
    );
    expect(category.relatedCategories.every((item) => item.id !== "dershane")).toBe(true);
    expect(category.buyingGuide.length).toBeGreaterThanOrEqual(4);
    expect(category.faqs.length).toBeGreaterThanOrEqual(3);
  });
});
