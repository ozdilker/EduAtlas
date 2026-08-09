import { describe, expect, it } from "vitest";
import { buildHomePageSeo } from "../pages/home";
import { createSeoSiteConfig } from "../site";
import { homeSchemaAdapter, searchSchemaAdapter } from "./adapters";
import {
  BreadcrumbSchemaBuilder,
  CollectionPageSchemaBuilder,
  EducationalOrganizationSchemaBuilder,
  ITEM_LIST_ORDER_ASCENDING,
  ItemListSchemaBuilder,
  OrganizationSchemaBuilder,
  SEARCH_TERM_STRING,
  SearchActionSchemaBuilder,
  WEBSITE_ALTERNATE_NAME,
  WebSiteSchemaBuilder,
} from "./builders";
import { SchemaEngine } from "./engine";
import {
  resolveEducationalOrganizationSchemaId,
  resolveOrganizationSchemaId,
  resolveWebSiteSchemaId,
} from "./ids";
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

describe("BreadcrumbSchemaBuilder", () => {
  it("emits one BreadcrumbList with canonical item urls and display names", () => {
    const breadcrumbs = BreadcrumbSchemaBuilder.build(site, {
      items: [
        { name: "Ana sayfa", path: "/" },
        { name: "İstanbul", path: "/cities/istanbul" },
        { name: "Kadıköy", path: "/cities/istanbul/kadikoy" },
        { name: "ABC Koleji", path: "/institutions/abc-koleji" },
      ],
    });

    expect(breadcrumbs["@type"]).toBe(SchemaOrgType.BreadcrumbList);
    expect(breadcrumbs.itemListElement).toEqual([
      {
        "@type": SchemaOrgType.ListItem,
        position: 1,
        name: "Ana sayfa",
        item: "https://eduatlas.com.tr/",
      },
      {
        "@type": SchemaOrgType.ListItem,
        position: 2,
        name: "İstanbul",
        item: "https://eduatlas.com.tr/cities/istanbul",
      },
      {
        "@type": SchemaOrgType.ListItem,
        position: 3,
        name: "Kadıköy",
        item: "https://eduatlas.com.tr/cities/istanbul/kadikoy",
      },
      {
        "@type": SchemaOrgType.ListItem,
        position: 4,
        name: "ABC Koleji",
        item: "https://eduatlas.com.tr/institutions/abc-koleji",
      },
    ]);
  });
});

describe("EducationalOrganizationSchemaBuilder", () => {
  it("emits one EducationalOrganization+LocalBusiness with parentOrganization", () => {
    const node = EducationalOrganizationSchemaBuilder.build(site, {
      name: "ABC Koleji",
      path: "/institutions/abc-koleji",
      description: "Kadıköy'de eğitim kurumu.",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Örnek Sok. No:1",
      telephone: "+90 216 000 00 00",
      email: "info@abc.edu.tr",
      latitude: 40.99,
      longitude: 29.02,
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      logoUrl: "https://cdn.example.com/logo.png",
      websiteUrl: "https://www.abc.edu.tr/",
    });

    expect(node["@type"]).toEqual([
      SchemaOrgType.EducationalOrganization,
      SchemaOrgType.LocalBusiness,
    ]);
    expect(node["@id"]).toBe(
      resolveEducationalOrganizationSchemaId(site, "/institutions/abc-koleji"),
    );
    expect(node.url).toBe("https://eduatlas.com.tr/institutions/abc-koleji");
    expect(node.description).toBe("Kadıköy'de eğitim kurumu.");
    expect(node.image).toBe("https://cdn.example.com/cover.jpg");
    expect(node.telephone).toBe("+90 216 000 00 00");
    expect(node.email).toBe("info@abc.edu.tr");
    expect(node.sameAs).toEqual(["https://www.abc.edu.tr/"]);
    expect(node.areaServed).toBe("İstanbul");
    expect(node.parentOrganization).toEqual({
      "@id": resolveOrganizationSchemaId(site),
    });
    expect(node.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 40.99,
      longitude: 29.02,
    });
    expect(node.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Örnek Sok. No:1",
      addressLocality: "Kadıköy",
      addressRegion: "İstanbul",
      addressCountry: "TR",
    });
  });

  it("omits optional fields and prefers logo then default image", () => {
    const withLogo = EducationalOrganizationSchemaBuilder.build(site, {
      name: "Okul",
      path: "/institutions/okul",
      description: "Açıklama",
      city: "Ankara",
      logoUrl: "https://cdn.example.com/logo-only.png",
    });
    expect(withLogo.image).toBe("https://cdn.example.com/logo-only.png");
    expect(withLogo.telephone).toBeUndefined();
    expect(withLogo.email).toBeUndefined();
    expect(withLogo.address).toBeUndefined();
    expect(withLogo.geo).toBeUndefined();
    expect(withLogo.sameAs).toBeUndefined();

    const fallback = EducationalOrganizationSchemaBuilder.build(site, {
      name: "Okul",
      path: "/institutions/okul",
      description: "Açıklama",
      city: "Ankara",
    });
    expect(fallback.image).toBe(site.defaultImageUrl);
  });

  it("is emitted once on institution pages via SchemaEngine", () => {
    const graphs = SchemaEngine.build("institution", site, {
      name: "ABC Koleji",
      typeLabel: "Özel Okul",
      typeSlug: "ozel-okul",
      city: "İstanbul",
      citySlug: "istanbul",
      district: "Kadıköy",
      districtSlug: "kadikoy",
      path: "/institutions/abc-koleji",
      description: "Meta açıklama",
    });
    expect(graphs).toHaveLength(2);
    expect(graphs[0]?.["@type"]).toBe(SchemaOrgType.BreadcrumbList);
    expect(graphs[1]?.["@type"]).toEqual([
      SchemaOrgType.EducationalOrganization,
      SchemaOrgType.LocalBusiness,
    ]);
    expect(graphs[1]?.description).toBe("Meta açıklama");
  });
});

describe("CollectionPageSchemaBuilder", () => {
  it("emits CollectionPage without ItemList when items are empty", () => {
    const page = CollectionPageSchemaBuilder.build(site, {
      path: "/cities/istanbul",
      name: "İstanbul eğitim kurumları",
      description: "İstanbul'da kurumları keşfedin.",
      items: [],
    });

    expect(page["@type"]).toBe(SchemaOrgType.CollectionPage);
    expect(page.url).toBe("https://eduatlas.com.tr/cities/istanbul");
    expect(page["@id"]).toBe("https://eduatlas.com.tr/cities/istanbul#collectionpage");
    expect(page.isPartOf).toEqual({ "@id": resolveWebSiteSchemaId(site) });
    expect(page.mainEntity).toBeUndefined();
  });

  it("nests ItemList with canonical ListItem urls and ascending positions", () => {
    const page = CollectionPageSchemaBuilder.build(site, {
      path: "/categories/anaokulu",
      name: "Anaokulu kurumları",
      description: "Türkiye genelinde anaokulu seçeneklerini keşfedin.",
      items: [
        { name: "Güneş Anaokulu", path: "/institutions/gunes-anaokulu" },
        { name: "Yıldız Kreş", path: "https://eduatlas.com.tr/institutions/yildiz-kres?utm=1" },
      ],
    });

    const list = page.mainEntity as Record<string, unknown>;
    expect(list["@type"]).toBe(SchemaOrgType.ItemList);
    expect(list.itemListOrder).toBe(ITEM_LIST_ORDER_ASCENDING);
    expect(list.numberOfItems).toBe(2);
    expect(list.itemListElement).toEqual([
      {
        "@type": SchemaOrgType.ListItem,
        position: 1,
        url: "https://eduatlas.com.tr/institutions/gunes-anaokulu",
        name: "Güneş Anaokulu",
      },
      {
        "@type": SchemaOrgType.ListItem,
        position: 2,
        url: "https://eduatlas.com.tr/institutions/yildiz-kres",
        name: "Yıldız Kreş",
      },
    ]);
  });

  it("ItemListSchemaBuilder returns null for empty input", () => {
    expect(ItemListSchemaBuilder.build(site, { items: [] })).toBeNull();
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
    // SearchAction omitted — /search is robots-disallowed; human forms still work.
    expect(website.potentialAction).toBeUndefined();
    expect(home.jsonLd.some((node) => node["@type"] === SchemaOrgType.SearchAction)).toBe(false);
  });

  it("accepts potentialAction override for future Action types", () => {
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

describe("SearchActionSchemaBuilder", () => {
  it("builds SearchAction urlTemplate from SiteConfig search path", () => {
    const configured = createSeoSiteConfig({
      siteUrl: "https://eduatlas.com.tr",
      searchPath: "/search",
      searchQueryParam: "q",
    });
    const action = SearchActionSchemaBuilder.build(configured);
    expect(action["@type"]).toBe(SchemaOrgType.SearchAction);
    expect(action["query-input"]).toBe(`required name=${SEARCH_TERM_STRING}`);
    expect(action.target).toEqual({
      "@type": "EntryPoint",
      urlTemplate: "https://eduatlas.com.tr/search?q={search_term_string}",
    });
  });

  it("does not hardcode search path when SiteConfig overrides it", () => {
    const configured = createSeoSiteConfig({
      siteUrl: "https://eduatlas.com.tr",
      searchPath: "/find",
      searchQueryParam: "query",
    });
    const action = SearchActionSchemaBuilder.build(configured);
    expect(action.target).toEqual({
      "@type": "EntryPoint",
      urlTemplate: "https://eduatlas.com.tr/find?query={search_term_string}",
    });
  });
});

describe("SchemaEngine home graph", () => {
  it("builds Organization + WebSite + BreadcrumbList via registry", () => {
    const graphs = SchemaEngine.build("home", site, {
      description: "Türkiye genelinde eğitim kurumlarını keşfedin.",
    });
    expect(graphs).toHaveLength(3);
    expect(graphs[0]?.["@type"]).toBe(SchemaOrgType.Organization);
    expect(graphs[0]?.description).toBe("Türkiye genelinde eğitim kurumlarını keşfedin.");
    expect(graphs[1]?.["@type"]).toBe(SchemaOrgType.WebSite);
    expect(graphs[2]?.["@type"]).toBe(SchemaOrgType.BreadcrumbList);
  });

  it("returns empty graph for search", () => {
    expect(SchemaEngine.build("search", site)).toEqual([]);
  });

  it("builds breadcrumb + CollectionPage graphs for hubs", () => {
    const city = SchemaEngine.build("city", site, {
      citySlug: "ankara",
      cityName: "Ankara",
      name: "Ankara eğitim kurumları",
      description: "Ankara'da eğitim kurumlarını keşfedin.",
    });
    expect(city).toHaveLength(2);
    expect(city[0]?.["@type"]).toBe(SchemaOrgType.BreadcrumbList);
    expect(city[1]?.["@type"]).toBe(SchemaOrgType.CollectionPage);
    expect(city[1]?.mainEntity).toBeUndefined();
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
