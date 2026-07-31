import { buildCanonical } from "../canonical";
import type { JsonLdObject, SeoSiteConfig } from "../types";

/**
 * SearchAction placeholder for WebSite schema.
 * Uses a static `/search?q=` template — not wired to live search.
 */
export function buildSearchActionJsonLd(
  site: Pick<SeoSiteConfig, "siteUrl">,
  options?: {
    pathTemplate?: string;
  },
): JsonLdObject {
  const pathTemplate = options?.pathTemplate ?? "/search?q={search_term_string}";
  const [pathname, query] = pathTemplate.split("?");
  const targetUrl = buildCanonical(site.siteUrl, pathname ?? "/search");
  const urlTemplate = query ? `${targetUrl}?${query}` : `${targetUrl}?q={search_term_string}`;

  return {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate,
    },
    "query-input": "required name=search_term_string",
  };
}
