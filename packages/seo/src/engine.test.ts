import { describe, expect, it } from "vitest";
import { MetadataEngine, buildPageSeo } from "./engine";
import { createSeoSiteConfig } from "./site";

const site = createSeoSiteConfig({
  siteName: "EduAtlas",
  siteUrl: "https://eduatlas.com",
});

describe("MetadataEngine", () => {
  it("resolves unique city titles from live names", () => {
    const ankara = MetadataEngine.resolve("city", site, {
      citySlug: "ankara",
      cityName: "Ankara",
    });
    expect(ankara.metadata.title).toEqual({
      absolute: "Ankara eğitim kurumları | EduAtlas",
    });
    expect(ankara.metadata.alternates.canonical).toBe("https://eduatlas.com/cities/ankara");
    expect(ankara.metadata.openGraph.title).toContain("Ankara");
    expect(ankara.metadata.twitter.card).toBe("summary_large_image");
  });

  it("builds district and city-type hubs with absolute canonicals", () => {
    const district = buildPageSeo("district", site, {
      citySlug: "istanbul",
      districtSlug: "kadikoy",
      cityName: "İstanbul",
      districtName: "Kadıköy",
    });
    expect(district.metadata.title).toEqual({
      absolute: "Kadıköy, İstanbul eğitim kurumları | EduAtlas",
    });
    expect(district.metadata.alternates.canonical).toBe(
      "https://eduatlas.com/cities/istanbul/kadikoy",
    );

    const cityType = buildPageSeo("city-type", site, {
      citySlug: "istanbul",
      typeSlug: "anaokulu",
      cityName: "İstanbul",
    });
    expect(cityType.metadata.title).toEqual({
      absolute: "İstanbul Anaokulları | EduAtlas",
    });
    expect(cityType.metadata.alternates.canonical).toBe(
      "https://eduatlas.com/cities/istanbul/types/anaokulu",
    );
  });

  it("builds static pages from catalog", () => {
    const about = MetadataEngine.resolve("static", site, { pageId: "about" });
    expect(about.metadata.alternates.canonical).toBe("https://eduatlas.com/about");
    expect(about.metadata.description.length).toBeGreaterThan(20);
  });

  it("keeps institution long title formula", () => {
    const page = MetadataEngine.resolve("institution", site, { slug: "ornek-anaokulu" });
    expect(page.metadata.title).toEqual({
      absolute: "Örnek Anaokulu | Anaokulu | Kadıköy, İstanbul | EduAtlas",
    });
  });

  it("lists registered kinds for Open/Closed extension", () => {
    expect(MetadataEngine.kinds()).toContain("district");
    expect(MetadataEngine.kinds()).toContain("static");
  });
});
