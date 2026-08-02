import { buildMetadata } from "../metadata";
import { SchemaEngine } from "../schema";
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
    jsonLd: [...SchemaEngine.build("home", site)],
  };
}
