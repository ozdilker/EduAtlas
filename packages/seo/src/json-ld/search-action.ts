import { CanonicalResolver } from "../canonical";
import type { JsonLdObject, SeoSiteConfig } from "../types";
import {
  SearchActionSchemaBuilder,
  resolveSearchUrlTemplate,
} from "../schema/builders/search-action";

/**
 * SearchAction JSON-LD for WebSite.potentialAction.
 * Prefers SchemaEngine / SearchActionSchemaBuilder for new call sites.
 */
export function buildSearchActionJsonLd(
  site: Pick<SeoSiteConfig, "siteUrl" | "searchPath" | "searchQueryParam">,
  options?: {
    /** Legacy path template e.g. `/search?q={search_term_string}`. */
    pathTemplate?: string;
  },
): JsonLdObject {
  const template = options?.pathTemplate?.trim();
  if (!template) {
    return SearchActionSchemaBuilder.build(site);
  }

  const [pathname, query] = template.split("?");
  const targetUrl = CanonicalResolver.resolve({
    siteUrl: site.siteUrl,
    path: pathname || site.searchPath || "/search",
  });
  const urlTemplate = query
    ? `${targetUrl}?${query}`
    : resolveSearchUrlTemplate({
        siteUrl: site.siteUrl,
        searchPath: pathname || site.searchPath,
        searchQueryParam: site.searchQueryParam || "q",
      });

  return SearchActionSchemaBuilder.build(site, { urlTemplate });
}
