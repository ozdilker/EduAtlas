import type { BreadcrumbItem, JsonLdObject, SeoSiteConfig } from "../types";
import { BreadcrumbSchemaBuilder } from "../schema/builders/breadcrumb";

/**
 * Sitewide BreadcrumbList JSON-LD matching the visible trail.
 * Prefers SchemaEngine / BreadcrumbSchemaBuilder for new call sites.
 */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
  site: Pick<SeoSiteConfig, "siteUrl">,
): JsonLdObject {
  return BreadcrumbSchemaBuilder.build(site, { items });
}
