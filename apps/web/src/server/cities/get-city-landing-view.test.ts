import { describe, expect, it } from "vitest";
import { getCityLandingView } from "./get-city-landing-view";

describe("getCityLandingView", () => {
  it("returns null for unknown city slugs", async () => {
    await expect(getCityLandingView("not-a-real-city")).resolves.toBeNull();
  });

  it("builds istanbul hub with real geography and search-backed sections", async () => {
    const landing = await getCityLandingView("istanbul");

    expect(landing).not.toBeNull();
    expect(landing?.slug).toBe("istanbul");
    expect(landing?.name).toBe("İstanbul");
    expect(landing?.title).toContain("İstanbul");
    expect(landing?.districts.length).toBeGreaterThan(5);
    expect(landing?.districts.every((item) => item.href.includes("/search?city=istanbul"))).toBe(
      true,
    );
    expect(landing?.categories.every((item) => item.href.includes("/search?city=istanbul"))).toBe(
      true,
    );
    expect(landing?.featuredInstitutions).toEqual([]);
    expect(landing?.statistics.some((item) => item.id === "institutions")).toBe(true);
  });
});
