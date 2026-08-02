import { CanonicalResolver } from "../../canonical";
import type { BreadcrumbItem, JsonLdObject, SeoSiteConfig } from "../../types";
import { SchemaOrgType } from "../types";

export type BreadcrumbSchemaBuildInput = Readonly<{
  /** Ordered trail matching visible navigation (names are display labels, not slugs). */
  readonly items: readonly BreadcrumbItem[];
}>;

/**
 * Schema.org BreadcrumbList — exactly one per indexable page via SchemaEngine adapters.
 */
export const BreadcrumbSchemaBuilder = {
  build(
    site: Pick<SeoSiteConfig, "siteUrl">,
    input: BreadcrumbSchemaBuildInput,
  ): JsonLdObject {
    const items = normalizeBreadcrumbItems(input.items);
    if (items.length === 0) {
      throw new Error("BreadcrumbSchemaBuilder requires at least one crumb");
    }

    return Object.freeze({
      "@context": "https://schema.org",
      "@type": SchemaOrgType.BreadcrumbList,
      itemListElement: items.map((item, index) => {
        const listItem: JsonLdObject = {
          "@type": SchemaOrgType.ListItem,
          position: index + 1,
          name: item.name,
        };

        if (item.path) {
          listItem.item = CanonicalResolver.resolve({
            siteUrl: site.siteUrl,
            path: item.path,
          });
        }

        return Object.freeze(listItem);
      }),
    });
  },
} as const;

function normalizeBreadcrumbItems(
  items: readonly BreadcrumbItem[],
): readonly BreadcrumbItem[] {
  return Object.freeze(
    items
      .map((item) => {
        const name = item.name?.trim() ?? "";
        if (!name) {
          return null;
        }
        const path = item.path?.trim();
        return path ? { name, path } : { name };
      })
      .filter((item): item is BreadcrumbItem => item !== null),
  );
}
