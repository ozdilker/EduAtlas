import { describe, expect, it } from "vitest";
import { buildHomePageSeo } from "../pages/home";
import { createSeoSiteConfig } from "../site";
import { SchemaEngine } from "./engine";
import { SchemaRegistry } from "./registry";
import { homeSchemaAdapter, searchSchemaAdapter } from "./adapters";
import { SchemaOrgType } from "./types";

const site = createSeoSiteConfig({
  siteName: "EduAtlas",
  siteUrl: "https://eduatlas.com",
});

describe("SchemaEngine", () => {
  it("matches legacy home JSON-LD via temporary adapters", () => {
    const viaEngine = SchemaEngine.build("home", site);
    const viaLegacy = buildHomePageSeo(site).jsonLd;
    // After page wiring, buildHomePageSeo also uses the engine — compare graph shape.
    expect(viaEngine).toHaveLength(2);
    expect(viaEngine[0]?.["@type"]).toBe(SchemaOrgType.Organization);
    expect(viaEngine[1]?.["@type"]).toBe(SchemaOrgType.WebSite);
    expect(viaEngine).toEqual(viaLegacy);
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
    const graphs = SchemaEngine.build("home", site, {}, { registry });
    expect(graphs[0]?.["@type"]).toBe(SchemaOrgType.WebPage);
  });
});
