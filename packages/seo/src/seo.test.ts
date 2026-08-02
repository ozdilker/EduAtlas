import { describe, expect, it } from "vitest";
import { buildCanonical } from "./canonical";
import { buildDescription } from "./description";
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildSearchActionJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
} from "./json-ld";
import { buildMetadata } from "./metadata";
import { buildOpenGraph } from "./open-graph";
import {
  buildCategoryPageSeo,
  buildCityPageSeo,
  buildHomePageSeo,
  buildInstitutionPageSeo,
  buildSearchPageSeo,
} from "./pages";
import { createSeoSiteConfig } from "./site";
import { buildTitle } from "./title";
import { buildTwitterCard } from "./twitter";

const site = createSeoSiteConfig({
  siteName: "EduAtlas",
  siteUrl: "https://eduatlas.com",
});

describe("buildTitle", () => {
  it("joins parts and appends the site name", () => {
    expect(buildTitle(["Örnek Anaokulu", "Anaokulu"], { siteName: "EduAtlas" })).toBe(
      "Örnek Anaokulu | Anaokulu | EduAtlas",
    );
  });

  it("does not duplicate the site name", () => {
    expect(buildTitle(["EduAtlas"], { siteName: "EduAtlas" })).toBe("EduAtlas");
  });
});

describe("buildDescription", () => {
  it("trims whitespace", () => {
    expect(buildDescription("  Kısa açıklama  ")).toBe("Kısa açıklama");
  });

  it("truncates long descriptions on word boundaries", () => {
    const long = "Aileler için ".repeat(20);
    const result = buildDescription(long, { maxLength: 40 });
    expect(result.length).toBeLessThanOrEqual(40);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("buildCanonical", () => {
  it("builds an absolute canonical without trailing slash (except root)", () => {
    expect(buildCanonical("https://eduatlas.com/", "/cities/istanbul/")).toBe(
      "https://eduatlas.com/cities/istanbul",
    );
    expect(buildCanonical("https://eduatlas.com", "/")).toBe("https://eduatlas.com/");
  });

  it("strips query and hash noise", () => {
    expect(buildCanonical("https://eduatlas.com", "/search?q=anaokulu#results")).toBe(
      "https://eduatlas.com/search",
    );
  });
});

describe("buildOpenGraph and buildTwitterCard", () => {
  it("builds social metadata with defaults", () => {
    const og = buildOpenGraph(
      {
        title: "Başlık",
        description: "Açıklama",
        url: "https://eduatlas.com/",
      },
      site,
    );
    const twitter = buildTwitterCard(
      {
        title: "Başlık",
        description: "Açıklama",
      },
      site,
    );

    expect(og.siteName).toBe("EduAtlas");
    expect(og.locale).toBe("tr_TR");
    expect(og.images?.[0]?.url).toBe("https://eduatlas.com/og/default.png");
    expect(twitter.card).toBe("summary_large_image");
  });
});

describe("buildMetadata", () => {
  it("composes reusable page metadata", () => {
    const metadata = buildMetadata({
      site,
      title: ["Kurum ara"],
      description: "Arama açıklaması",
      path: "/search",
      robots: { index: false, follow: true },
    });

    expect(metadata.title).toEqual({ absolute: "Kurum ara | EduAtlas" });
    expect(metadata.alternates.canonical).toBe("https://eduatlas.com/search");
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.openGraph.url).toBe("https://eduatlas.com/search");
    expect(metadata.twitter.title).toBe("Kurum ara | EduAtlas");
  });
});

describe("JSON-LD helpers", () => {
  it("builds Organization, WebSite, SearchAction, and BreadcrumbList", () => {
    const organization = buildOrganizationJsonLd(site);
    const website = buildWebsiteJsonLd(site);
    const searchAction = buildSearchActionJsonLd(site);
    const breadcrumbs = buildBreadcrumbJsonLd(
      [
        { name: "Ana sayfa", path: "/" },
        { name: "İstanbul", path: "/cities/istanbul" },
        { name: "Örnek" },
      ],
      site,
    );

    expect(organization["@type"]).toBe("Organization");
    expect(website["@type"]).toBe("WebSite");
    expect(website.potentialAction).toEqual(searchAction);
    expect(searchAction["@type"]).toBe("SearchAction");
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(serializeJsonLd(organization)).toContain("EduAtlas");
    expect(serializeJsonLd({ html: "<script>" })).toContain("\\u003cscript>");
  });
});

describe("page SEO builders", () => {
  it("builds home SEO with Organization, WebSite, and BreadcrumbList JSON-LD", () => {
    const page = buildHomePageSeo(site);
    expect(page.metadata.alternates.canonical).toBe("https://eduatlas.com/");
    expect(page.jsonLd.map((n) => n["@type"])).toEqual([
      "Organization",
      "WebSite",
      "BreadcrumbList",
    ]);
  });

  it("builds search SEO as noindex", () => {
    const page = buildSearchPageSeo(site);
    expect(page.metadata.robots?.index).toBe(false);
    expect(page.jsonLd).toEqual([]);
  });

  it("builds institution, city, and category SEO with static demo content", () => {
    const institution = buildInstitutionPageSeo(site, { slug: "ornek-anaokulu" });
    const city = buildCityPageSeo(site, { citySlug: "istanbul", cityName: "İstanbul" });
    const ankara = buildCityPageSeo(site, { citySlug: "ankara", cityName: "Ankara" });
    const category = buildCategoryPageSeo(site, { categorySlug: "anaokulu" });
    const dershane = buildCategoryPageSeo(site, { categorySlug: "dershane" });

    expect(institution.metadata.alternates.canonical).toBe(
      "https://eduatlas.com/institutions/ornek-anaokulu",
    );
    expect(institution.metadata.title).toEqual({
      absolute: "Örnek Anaokulu | Anaokulu | Kadıköy, İstanbul | EduAtlas",
    });
    expect(city.metadata.alternates.canonical).toBe("https://eduatlas.com/cities/istanbul");
    expect(city.metadata.title).toEqual({
      absolute: "İstanbul eğitim kurumları | EduAtlas",
    });
    expect(ankara.metadata.title).toEqual({
      absolute: "Ankara eğitim kurumları | EduAtlas",
    });
    expect(category.metadata.alternates.canonical).toBe("https://eduatlas.com/categories/anaokulu");
    expect(category.metadata.title).toEqual({
      absolute: "Anaokulu kurumları | EduAtlas",
    });
    expect(dershane.metadata.alternates.canonical).toBe("https://eduatlas.com/categories/dershane");
    expect(dershane.metadata.title).toEqual({
      absolute: "Dershane kurumları | EduAtlas",
    });
    expect(institution.jsonLd[0]?.["@type"]).toBe("BreadcrumbList");
    const crumbs = institution.jsonLd[0]?.itemListElement as Array<Record<string, unknown>>;
    expect(crumbs).toHaveLength(5);
    expect(crumbs.every((c) => typeof c.item === "string" && typeof c.name === "string")).toBe(
      true,
    );
    expect(crumbs[4]?.name).toBe("Örnek Anaokulu");
    expect(crumbs[4]?.item).toBe("https://eduatlas.com/institutions/ornek-anaokulu");
    expect(city.jsonLd.map((n) => n["@type"])).toEqual(["BreadcrumbList", "CollectionPage"]);
    expect(category.jsonLd.map((n) => n["@type"])).toEqual(["BreadcrumbList", "CollectionPage"]);
    expect(city.jsonLd[1]?.mainEntity).toBeUndefined();
  });
});
