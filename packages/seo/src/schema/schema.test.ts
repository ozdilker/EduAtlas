import { describe, expect, it } from "vitest";
import { buildHomePageSeo } from "../pages/home";
import { createSeoSiteConfig } from "../site";
import { homeSchemaAdapter, searchSchemaAdapter } from "./adapters";
import { WEBSITE_ALTERNATE_NAME, WebSiteSchemaBuilder } from "./builders";
import { SchemaEngine } from "./engine";
import { resolveOrganizationSchemaId, resolveWebSiteSchemaId } from "./ids";
import { SchemaRegistry } from "./registry";
import { SchemaOrgType } from "./types";

const site = createSeoSiteConfig({
  siteName: "EduAtlas",
  siteUrl: "https://eduatlas.com.tr",
});

describe("WebSiteSchemaBuilder", () => {
  it("emits a single WebSite with publisher @id and metadata description", () => {
    const home = buildHomePageSeo(site);
    const websites = home.jsonLd.filter((node) => node["@type"] === SchemaOrgType.WebSite);
    const organizations = home.jsonLd.filter(
      (node) => node["@type"] === SchemaOrgType.Organization,
    );

    expect(websites).toHaveLength(1);
    expect(organizations).toHaveLength(1);

    const website = websites[0]!;
    expect(website["@id"]).toBe(resolveWebSiteSchemaId(site));
    expect(website.url).toBe("https://eduatlas.com.tr");
    expect(website.name).toBe("EduAtlas");
    expect(website.alternateName).toBe(WEBSITE_ALTERNATE_NAME);
    expect(website.description).toBe(home.metadata.description);
    expect(website.inLanguage).toBe("tr-TR");
    expect(website.publisher).toEqual({ "@id": resolveOrganizationSchemaId(site) });
    expect(website.potentialAction).toBeUndefined();
  });

  it("accepts potentialAction when provided for future SearchAction", () => {
    const action = {
      "@type": SchemaOrgType.SearchAction,
      target: "https://eduatlas.com.tr/search?q={search_term_string}",
    };
    const website = WebSiteSchemaBuilder.build({
      site,
      input: { description: "Test açıklama", potentialAction: action },
    });
    expect(website.potentialAction).toEqual(action);
  });
});

describe("SchemaEngine home graph", () => {
  it("builds Organization + WebSite via registry", () => {
    const graphs = SchemaEngine.build("home", site, {
      description: "Türkiye genelinde eğitim kurumlarını keşfedin.",
    });
    expect(graphs).toHaveLength(2);
    expect(graphs[0]?.["@type"]).toBe(SchemaOrgType.Organization);
    expect(graphs[1]?.["@type"]).toBe(SchemaOrgType.WebSite);
  });

  it("returns empty graph for search", () => {
    expect(SchemaEngine.build("search", site)).toEqual([]);
  });

  it("builds breadcrumb graphs for hubs", () => {
    const city = SchemaEngine.build("city", site, { cityName: "Ankara" });
    expect(city).toHaveLength(1);
    expect(city[0]?.["@type"]).toBe(SchemaOrgType.BreadcrumbList);
  });

  it("allows Open/Closed registration of a replacement builder", () => {
    const registry = new SchemaRegistry([searchSchemaAdapter, homeSchemaAdapter]);
    registry.register({
      kind: "home",
      build: () => Object.freeze([{ "@context": "https://schema.org", "@type": "WebPage" }]),
    });
    const graphs = SchemaEngine.build(
      "home",
      site,
      { description: "x" },
      { registry },
    );
    expect(graphs[0]?.["@type"]).toBe(SchemaOrgType.WebPage);
  });
});
