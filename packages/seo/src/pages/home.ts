import { buildOrganizationJsonLd } from "../json-ld/organization";
import { buildWebsiteJsonLd } from "../json-ld/website";
import { buildMetadata } from "../metadata";
import type { JsonLdObject, SeoMetadata, SeoSiteConfig } from "../types";

export type PageSeoResult = {
  metadata: SeoMetadata;
  jsonLd: JsonLdObject[];
};

/**
 * Home page SEO — indexable discovery landing.
 */
export function buildHomePageSeo(site: SeoSiteConfig): PageSeoResult {
  const metadata = buildMetadata({
    site,
    title: site.siteName,
    description:
      site.defaultDescription ??
      "Türkiye'nin eğitim keşif platformu. Kurumları karşılaştırın, konum ve türe göre keşfedin.",
    path: "/",
    absoluteTitle: true,
    includeSiteNameInTitle: false,
  });

  return {
    metadata,
    jsonLd: [buildOrganizationJsonLd(site), buildWebsiteJsonLd(site)],
  };
}
