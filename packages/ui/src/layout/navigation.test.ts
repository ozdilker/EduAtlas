import { describe, expect, it } from "vitest";
import {
  getFooterSections,
  getPrimaryNavItems,
  getPriorityCategoryLinks,
  getPriorityCityLinks,
  getSocialPlaceholders,
  isNavItemActive,
} from "./navigation";

describe("layout navigation", () => {
  it("exposes primary nav to live public routes", () => {
    const items = getPrimaryNavItems();

    expect(items.map((item) => item.id)).toEqual([
      "categories",
      "cities",
      "about",
      "contact",
    ]);
    expect(items.every((item) => item.href.startsWith("/"))).toBe(true);
  });

  it("exposes priority city and category shortcuts", () => {
    expect(getPriorityCityLinks().every((item) => item.href.startsWith("/cities/"))).toBe(true);
    expect(getPriorityCategoryLinks().every((item) => item.href.startsWith("/categories/"))).toBe(
      true,
    );
  });

  it("exposes footer discovery sections", () => {
    const sections = getFooterSections();

    expect(sections.map((section) => section.id)).toEqual([
      "explore",
      "cities",
      "categories",
      "company",
      "legal",
    ]);
    expect(sections.flatMap((section) => section.links).length).toBeGreaterThan(10);
  });

  it("marks current nav items from the pathname", () => {
    expect(isNavItemActive("/cities", "/cities/ankara")).toBe(true);
    expect(isNavItemActive("/categories", "/search")).toBe(false);
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/cities")).toBe(false);
  });

  it("exposes social placeholders without live URLs", () => {
    const social = getSocialPlaceholders();

    expect(social).toHaveLength(3);
    expect(social.every((item) => item.href === "")).toBe(true);
  });
});
