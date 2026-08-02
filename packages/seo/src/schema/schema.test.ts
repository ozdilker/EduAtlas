import { describe, expect, it } from "vitest";
import { buildHomePageSeo } from "../pages/home";
import { createSeoSiteConfig } from "../site";
import { homeSchemaAdapter, searchSchemaAdapter } from "./adapters";
import {
  OrganizationSchemaBuilder,
  WEBSITE_ALTERNATE_NAME,
  WebSiteSchemaBuilder,
} from "./builders";
import { SchemaEngine } from "./engine";
import { resolveOrganizationSchemaId, resolveWebSiteSchemaId } from "./ids";
import {
  EDUATLAS_ALTERNATE_NAME,
  ORGANIZATION_AREA_SERVED,
  ORGANIZATION_KNOWS_ABOUT,
} from "./organization-constants";
import { SchemaRegistry } from "./registry";
import { SchemaOrgType } from "./types";

const site = createSeoSiteConfig({
  siteName: "EduAtlas",
  siteUrl: "https://eduatlas.com.tr",
});

describe("OrganizationSchemaBuilder", () => {
  it("emits full Organization from SiteConfig + home description", () => {
    const home = buildHomePageSeo(site);
    const organizations = home.jsonLd.filter(
      (node) => node["@type"] === SchemaOrgType.Organization,
    );

    expect(organizations).toHaveLength(1);
    const organization = organizations[0]!;

    expect(organization["@id"]).toBe(resolveOrganizationSchemaId(site));
    expect(organization.name).toBe("EduAtlas");
    expect(organization.alternateName).toBe(EDUATLAS_ALTERNATE_NAME);
    expect(organization.url).toBe("https://eduatlas.com.tr");
    expect(organization.logo).toBe(site.logoUrl);
    expect(organization.image).toBe(site.defaultImageUrl);
    expect(organization.description).toBe(home.metadata.description);
    expect(organization.knowsAbout).toEqual([...ORGANIZATION_KNOWS_ABOUT]);
    expect(organization.areaServed).toBe(ORGANIZATION_AREA_SERVED);
    expect(organization.inLanguage).toBe("tr-TR");
    expect(organization.email).toBeUndefined();
    expect(organization.telephone).toBeUndefined();
    expect(organization.address).toBeUndefined();
    expect(organization.foundingDate).toBeUndefined();
    expect(organization.sameAs).toBeUndefined();
  });

  it("includes optional contact and sameAs only when set on SiteConfig", () => {
    const configured = createSeoSiteConfig({
      siteName: "EduAtlas",
      siteUrl: "https://eduatlas.com.tr",
      organizationEmail: "info@eduatlas.com.tr",
      organizationTelephone: "+90 212 000 00 00",
      organizationFoundingDate: "2024-01-01",
      organizationAddress: {
        addressLocality: "İstanbul",
        addressCountry: "TR",
      },
      organizationSameAs: [
        "https://www.instagram.com/eduatlas",
        "https://www.linkedin.com/company/eduatlas",
        "  ",
      ],
    });

    const organization = OrganizationSchemaBuilder.build(configured, {
      description: "Ana sayfa açıklaması",
    });

    expect(organization.email).toBe("info@eduatlas.com.tr");
    expect(organization.telephone).toBe("+90 212 000 00 00");
    expect(organization.foundingDate).toBe("2024-01-01");
    expect(organization.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "İstanbul",
      addressCountry: "TR",
    });
    expect(organization.sameAs).toEqual([
      "https://www.instagram.com/eduatlas",
      "https://www.linkedin.com/company/eduatlas",
    ]);
  });

  it("does not hardcode absolute logo or image paths", () => {
    const configured = createSeoSiteConfig({
      siteUrl: "https://cdn.example.com",
      logoUrl: "https://cdn.example.com/custom-logo.svg",
      defaultImageUrl: "https://cdn.example.com/share.jpg",
    });
    const organization = OrganizationSchemaBuilder.build(configured, {
      description: "Açıklama",
    });
    expect(organization.logo).toBe("https://cdn.example.com/custom-logo.svg");
    expect(organization.image).toBe("https://cdn.example.com/share.jpg");
    expect(organization.url).toBe("https://cdn.example.com");
  });
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
    expect(graphs[0]?.description).toBe("Türkiye genelinde eğitim kurumlarını keşfedin.");
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
    expect(graphs[0]?.["@type"]).toBe("WebPage");
  });
});
