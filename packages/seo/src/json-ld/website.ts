import type { JsonLdObject, SeoSiteConfig } from "../types";
import { buildSearchActionJsonLd } from "./search-action";

/**
 * WebSite JSON-LD for the home surface.
 * SearchAction is opt-in only — default off (robots Disallow: /search).
 */
export function buildWebsiteJsonLd(
  site: SeoSiteConfig,
  options?: {
    includeSearchAction?: boolean;
    searchPathTemplate?: string;
  },
): JsonLdObject {
  const includeSearchAction = options?.includeSearchAction ?? false;
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
