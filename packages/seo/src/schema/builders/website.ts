import type { JsonLdObject } from "../../types";
import { resolveOrganizationSchemaId, resolveSiteOriginUrl, resolveWebSiteSchemaId } from "../ids";
import { EDUATLAS_ALTERNATE_NAME } from "../organization-constants";
import type { SchemaBuildContext } from "../types";
import { SchemaOrgType } from "../types";

/** @deprecated Prefer EDUATLAS_ALTERNATE_NAME — kept for existing imports. */
export const WEBSITE_ALTERNATE_NAME = EDUATLAS_ALTERNATE_NAME;

export type WebSiteSchemaBuildInput = Readonly<{
  readonly description: string;
  /**
   * Optional potentialAction override (e.g. future Action types).
   * Omitted by default — SearchAction is not emitted because `/search` is robots-disallowed.
   */
  readonly potentialAction?: JsonLdObject;
}>;

/**
 * Schema.org WebSite builder — home page only (one node per site).
 * Does not advertise SearchAction (consistent with Disallow: /search).
 */
export const WebSiteSchemaBuilder = {
  build(
    context: Pick<SchemaBuildContext<"home">, "site"> & {
      input: WebSiteSchemaBuildInput;
    },
  ): JsonLdObject {
    const { site, input } = context;
    const origin = resolveSiteOriginUrl(site);
    const description = input.description.trim();

    const website: JsonLdObject = {
      "@context": "https://schema.org",
      "@type": SchemaOrgType.WebSite,
      "@id": resolveWebSiteSchemaId(site),
      url: origin,
      name: site.siteName,
      alternateName: EDUATLAS_ALTERNATE_NAME,
      description:
        description ||
        site.defaultDescription ||
        "Türkiye genelinde anaokulu, dershane ve eğitim kurumlarını keşfedin.",
      publisher: {
        "@id": resolveOrganizationSchemaId(site),
      },
      inLanguage: site.locale?.replace("_", "-") || "tr-TR",
      ...(input.potentialAction ? { potentialAction: input.potentialAction } : {}),
    };

    return Object.freeze(website);
  },
} as const;
