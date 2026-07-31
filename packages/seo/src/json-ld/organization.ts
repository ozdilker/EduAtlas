import type { JsonLdObject, SeoSiteConfig } from "../types";

/**
 * Sitewide Organization (publisher) JSON-LD.
 */
export function buildOrganizationJsonLd(site: SeoSiteConfig): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.siteName,
    url: site.siteUrl.replace(/\/+$/, ""),
    ...(site.logoUrl ? { logo: site.logoUrl } : {}),
  };
}
