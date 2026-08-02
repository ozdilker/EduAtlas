import type { JsonLdObject, SeoSiteConfig } from "../../types";
import { resolveOrganizationSchemaId, resolveSiteOriginUrl } from "../ids";
import { SchemaOrgType } from "../types";

/**
 * Organization node builder — used as WebSite.publisher @id target on the home graph.
 * Full Organization SEO PRD may replace/extend this later; no separate json-ld helper.
 */
export const OrganizationSchemaBuilder = {
  build(site: SeoSiteConfig): JsonLdObject {
    const origin = resolveSiteOriginUrl(site);
    return Object.freeze({
      "@context": "https://schema.org",
      "@type": SchemaOrgType.Organization,
      "@id": resolveOrganizationSchemaId(site),
      name: site.siteName,
      url: origin,
      ...(site.logoUrl ? { logo: site.logoUrl } : {}),
    });
  },
} as const;
