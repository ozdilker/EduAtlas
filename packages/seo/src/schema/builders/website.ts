import type { JsonLdObject } from "../../types";
import { resolveOrganizationSchemaId, resolveSiteOriginUrl, resolveWebSiteSchemaId } from "../ids";
import type { SchemaBuildContext } from "../types";
import { SchemaOrgType } from "../types";

export const WEBSITE_ALTERNATE_NAME = "Türkiye'nin Eğitim Atlası";

export type WebSiteSchemaBuildInput = Readonly<{
  readonly description: string;
  /** Reserved for SearchAction — omit / undefined in this PRD. */
  readonly potentialAction?: JsonLdObject;
}>;

/**
 * Schema.org WebSite builder — home page only (one node per site).
 * Implements the schema-builder contract used by the home registry entry.
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
      alternateName: WEBSITE_ALTERNATE_NAME,
      description:
        description ||
        site.defaultDescription ||
        "Türkiye genelinde anaokulu, dershane ve eğitim kurumlarını keşfedin.",
      publisher: {
        "@id": resolveOrganizationSchemaId(site),
      },
      inLanguage: site.locale?.replace("_", "-") || "tr-TR",
    };

    if (input.potentialAction) {
      website.potentialAction = input.potentialAction;
    }

    return Object.freeze(website);
  },
} as const;
