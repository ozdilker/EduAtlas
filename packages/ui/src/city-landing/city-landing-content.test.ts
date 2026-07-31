import { describe, expect, it } from "vitest";
import { getStaticCityLanding } from "./city-landing-content";

describe("city landing static content", () => {
  it("exposes ankara hub presentation data under /cities canonical paths", () => {
    const city = getStaticCityLanding("ankara");

    expect(city.slug).toBe("ankara");
    expect(city.name).toBe("Ankara");
    expect(city.title).toContain("Ankara");
    expect(city.breadcrumbs.at(-1)?.label).toBe("Ankara");
    expect(city.categories.every((item) => item.href.startsWith("/cities/ankara/types/"))).toBe(
      true,
    );
    expect(city.districts.every((item) => item.href.startsWith("/cities/ankara/"))).toBe(true);
  });

  it("includes guides and related cities", () => {
    const city = getStaticCityLanding("ankara");

    expect(city.guides.length).toBeGreaterThanOrEqual(3);
    expect(city.relatedCities.every((item) => item.href.startsWith("/cities/"))).toBe(true);
    expect(city.statistics.length).toBe(4);
  });
});
