import { CanonicalResolver } from "../../canonical";
import type { JsonLdObject, SeoSiteConfig } from "../../types";
import { SchemaOrgType } from "../types";

export const SEARCH_TERM_STRING = "search_term_string" as const;

export type SearchActionSchemaBuildInput = Readonly<{
  /**
   * Optional override for future Action variants (Institution Search, etc.).
   * Default: site SiteConfig search path + query param.
   */
  readonly urlTemplate?: string;
}>;

/**
 * Schema.org SearchAction for WebSite.potentialAction.
 * Static — no Firestore; URL comes from SiteConfig.
 */
export const SearchActionSchemaBuilder = {
  build(
    site: Pick<SeoSiteConfig, "siteUrl" | "searchPath" | "searchQueryParam">,
    input: SearchActionSchemaBuildInput = {},
  ): JsonLdObject {
    const urlTemplate = input.urlTemplate?.trim() || resolveSearchUrlTemplate(site);

    return Object.freeze({
      "@type": SchemaOrgType.SearchAction,
      target: Object.freeze({
        "@type": "EntryPoint",
        urlTemplate,
      }),
      "query-input": `required name=${SEARCH_TERM_STRING}`,
    });
  },
} as const;

/** PRD alias. */
export const SearchActionBuilder = SearchActionSchemaBuilder;

/**
 * Builds `{origin}{searchPath}?{param}={search_term_string}` from SiteConfig.
 */
export function resolveSearchUrlTemplate(
  site: Pick<SeoSiteConfig, "siteUrl" | "searchPath" | "searchQueryParam">,
): string {
  const searchPath = site.searchPath?.trim();
  const queryParam = site.searchQueryParam?.trim();

  if (!searchPath || !queryParam) {
    throw new Error(
      "SeoSiteConfig.searchPath and searchQueryParam are required for SearchAction",
    );
  }

  const pathname = searchPath.split(/[?#]/)[0] || searchPath;
  const originPath = CanonicalResolver.resolve({
    siteUrl: site.siteUrl,
    path: pathname,
  });

  return `${originPath}?${queryParam}={${SEARCH_TERM_STRING}}`;
}
