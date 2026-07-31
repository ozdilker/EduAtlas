import type { JsonLdObject, SeoSiteConfig } from "../types";
import { buildSearchActionJsonLd } from "./search-action";

/**
 * WebSite JSON-LD for the home surface.
 * Includes a SearchAction placeholder when enabled.
 */
export function buildWebsiteJsonLd(
  site: SeoSiteConfig,
  options?: {
    includeSearchAction?: boolean;
    searchPathTemplate?: string;
  },
): JsonLdObject {
  const includeSearchAction = options?.includeSearchAction ?? true;
  const website: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.siteName,
    url: site.siteUrl.replace(/\/+$/, ""),
    inLanguage: "tr-TR",
  };

  if (includeSearchAction) {
    website.potentialAction = buildSearchActionJsonLd(site, {
      pathTemplate: options?.searchPathTemplate,
    });
  }

  return website;
}
