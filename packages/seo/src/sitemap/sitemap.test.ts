import { describe, expect, it } from "vitest";
import { createSitemapSnapshot } from "./derive";
import { buildSitemapDocuments } from "./generator";
import { pagesSitemapProvider } from "./providers";
import type { SitemapInstitutionRef } from "./types";
import { SITEMAP_MAX_URLS_PER_FILE } from "./types";
import { serializeSitemapIndex, serializeUrlset } from "./xml";

const generatedAt = "2026-08-02T10:00:00.000Z";

function ref(partial: Partial<SitemapInstitutionRef> & Pick<SitemapInstitutionRef, "slug">): SitemapInstitutionRef {
  return {
    slug: partial.slug,
    updatedAt: partial.updatedAt ?? "2026-08-01T12:00:00.000Z",
    publishedAt: partial.publishedAt,
    createdAt: partial.createdAt,
    citySlug: partial.citySlug ?? "istanbul",
    districtSlug: partial.districtSlug ?? "kadikoy",
    typeSlug: partial.typeSlug ?? "anaokulu",
  };
}

describe("createSitemapSnapshot", () => {
  it("derives supply-gated hubs from institutions only", () => {
    const snapshot = createSitemapSnapshot({
      siteUrl: "https://eduatlas.com.tr",
      generatedAt,
      institutions: [
        ref({ slug: "a", citySlug: "istanbul", districtSlug: "kadikoy", typeSlug: "anaokulu" }),
        ref({
          slug: "b",
          citySlug: "ankara",
          districtSlug: "cankaya",
          typeSlug: "dil-okulu",
          updatedAt: "2026-08-02T00:00:00.000Z",
        }),
      ],
    });

    expect([...snapshot.cities.keys()].sort()).toEqual(["ankara", "istanbul"]);
    expect(snapshot.districts.has("istanbul/kadikoy")).toBe(true);
    expect(snapshot.categories.has("dil-okulu")).toBe(true);
    expect(snapshot.categories.has("dil-kursu")).toBe(false);
    expect(snapshot.cityTypes.has("istanbul|anaokulu")).toBe(true);
    expect(snapshot.cities.get("ankara")).toBe("2026-08-02T00:00:00.000Z");
  });
});

describe("buildSitemapDocuments", () => {
  it("emits live path shapes and excludes empty hubs", () => {
    const snapshot = createSitemapSnapshot({
      siteUrl: "https://eduatlas.com.tr/",
      generatedAt,
      institutions: [ref({ slug: "ornek-anaokulu" })],
    });

    const built = buildSitemapDocuments(snapshot);
    const pagePaths = built.urlsets.get("pages.xml")?.map((e) => e.path) ?? [];
    expect(pagePaths).toContain("/");
    expect(pagePaths).toContain("/about");
    expect(pagePaths).not.toContain("/owner");
    expect(pagePaths).not.toContain("/admin");
    expect(pagePaths).not.toContain("/login");
    expect(pagePaths).not.toContain("/search");

    expect(built.urlsets.get("cities.xml")?.map((e) => e.path)).toEqual(["/cities/istanbul"]);
    expect(built.urlsets.get("districts.xml")?.map((e) => e.path)).toEqual([
      "/cities/istanbul/kadikoy",
    ]);
    expect(built.urlsets.get("categories.xml")?.map((e) => e.path)).toEqual([
      "/categories/anaokulu",
    ]);
    expect(built.urlsets.get("city-types.xml")?.map((e) => e.path)).toEqual([
      "/cities/istanbul/types/anaokulu",
    ]);
    expect(built.urlsets.get("institutions.xml")?.map((e) => e.path)).toEqual([
      "/institutions/ornek-anaokulu",
    ]);

    const childNames = built.children.map((c) => c.name);
    expect(childNames).toContain("pages.xml");
    expect(childNames).toContain("city-types.xml");
    expect(childNames).not.toContain("dil-kursu.xml");
  });

  it("chunks institutions beyond the URL limit", () => {
    const institutions = Array.from({ length: 5 }, (_, i) =>
      ref({ slug: `inst-${String(i).padStart(2, "0")}` }),
    );
    const snapshot = createSitemapSnapshot({
      siteUrl: "https://eduatlas.com.tr",
      generatedAt,
      institutions,
    });

    const built = buildSitemapDocuments(snapshot, { maxUrlsPerFile: 2 });
    expect(built.urlsets.get("institutions.xml")).toHaveLength(2);
    expect(built.urlsets.get("institutions-2.xml")).toHaveLength(2);
    expect(built.urlsets.get("institutions-3.xml")).toHaveLength(1);
    expect(built.children.filter((c) => c.name.startsWith("institutions")).map((c) => c.name)).toEqual([
      "institutions.xml",
      "institutions-2.xml",
      "institutions-3.xml",
    ]);
  });

  it("keeps default max at Google soft limit", () => {
    expect(SITEMAP_MAX_URLS_PER_FILE).toBe(50_000);
  });
});

describe("serialize", () => {
  it("escapes XML and writes absolute locs", () => {
    const xml = serializeUrlset("https://eduatlas.com.tr", [
      {
        path: "/institutions/a&b",
        lastmod: generatedAt,
        changefreq: "weekly",
        priority: 0.8,
      },
    ]);
    expect(xml).toContain("<loc>https://eduatlas.com.tr/institutions/a&amp;b</loc>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("serializes sitemap index children", () => {
    const xml = serializeSitemapIndex("https://eduatlas.com.tr", [
      { name: "pages.xml", path: "/sitemaps/pages.xml", lastmod: generatedAt },
    ]);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<loc>https://eduatlas.com.tr/sitemaps/pages.xml</loc>");
  });
});

describe("pagesSitemapProvider", () => {
  it("never includes private surfaces", () => {
    const snapshot = createSitemapSnapshot({
      siteUrl: "https://eduatlas.com.tr",
      generatedAt,
      institutions: [],
    });
    const paths = pagesSitemapProvider.collect(snapshot).map((e) => e.path);
    for (const forbidden of ["/owner", "/admin", "/login", "/register", "/search", "/claim", "/api"]) {
      expect(paths.some((p) => p === forbidden || p.startsWith(`${forbidden}/`))).toBe(false);
    }
  });
});
