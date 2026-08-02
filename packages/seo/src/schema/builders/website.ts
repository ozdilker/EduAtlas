import type { JsonLdObject } from "../../types";
import { resolveOrganizationSchemaId, resolveSiteOriginUrl, resolveWebSiteSchemaId } from "../ids";
import { EDUATLAS_ALTERNATE_NAME } from "../organization-constants";
import type { SchemaBuildContext } from "../types";
import { SchemaOrgType } from "../types";
import { SearchActionSchemaBuilder } from "./search-action";

/** @deprecated Prefer EDUATLAS_ALTERNATE_NAME — kept for existing imports. */
export const WEBSITE_ALTERNATE_NAME = EDUATLAS_ALTERNATE_NAME;

export type WebSiteSchemaBuildInput = Readonly<{
  readonly description: string;
  /**
   * Optional override for potentialAction (future Action types).
   * When omitted, SearchActionSchemaBuilder fills potentialAction from SiteConfig.
   */
  readonly potentialAction?: JsonLdObject;
}>;

/**
 * Schema.org WebSite builder — home page only (one node per site).
 * potentialAction is SearchAction from SearchActionBuilder by default.
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
      potentialAction: input.potentialAction ?? SearchActionSchemaBuilder.build(site),
    };

    return Object.freeze(website);
  },
} as const;
