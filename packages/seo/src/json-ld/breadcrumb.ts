import { buildCanonical } from "../canonical";
import type { BreadcrumbItem, JsonLdObject, SeoSiteConfig } from "../types";

/**
 * BreadcrumbList JSON-LD matching the visible trail.
 */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
  site: Pick<SeoSiteConfig, "siteUrl">,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path
        ? {
            item: buildCanonical(site.siteUrl, item.path),
          }
        : {}),
    })),
  };
}
