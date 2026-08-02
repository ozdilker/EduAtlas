import { buildMetadata } from "../metadata";
import { SchemaEngine } from "../schema";
import type { SeoSiteConfig } from "../types";
import type { PageSeoResult } from "./home";

/**
 * Search page SEO — noindex for arbitrary facet surfaces.
 */
export function buildSearchPageSeo(site: SeoSiteConfig): PageSeoResult {
  const metadata = buildMetadata({
    site,
    title: ["Kurum ara"],
    description:
      "Türkiye genelinde eğitim kurumlarını keşfedin. Statik arama arayüzü yer tutucusu.",
    path: "/search",
    robots: {
      index: false,
      follow: true,
    },
  });

  return {
    metadata,
    jsonLd: [...SchemaEngine.build("search", site)],
  };
}
