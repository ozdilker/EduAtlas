import { CanonicalResolver } from "../../canonical";
import type { JsonLdObject, SeoSiteConfig } from "../../types";
import { resolveWebSiteSchemaId } from "../ids";
import { SchemaOrgType, type SchemaListInstitutionItem } from "../types";
import { ItemListSchemaBuilder } from "./item-list";

export type CollectionPageSchemaBuildInput = Readonly<{
  /** Listing page path (e.g. `/cities/istanbul`). */
  readonly path: string;
  readonly name: string;
  readonly description: string;
  /** Institutions shown on the page — empty/omitted → no ItemList. */
  readonly items?: readonly SchemaListInstitutionItem[];
}>;

/**
 * Schema.org CollectionPage for listing hubs (city, district, category, city×type).
 */
export const CollectionPageSchemaBuilder = {
  build(
    site: SeoSiteConfig,
    input: CollectionPageSchemaBuildInput,
  ): JsonLdObject {
    const url = CanonicalResolver.resolve({
      siteUrl: site.siteUrl,
      path: input.path,
    });
    const name = input.name.trim();
    const description = input.description.trim();

    const page: JsonLdObject = {
      "@context": "https://schema.org",
      "@type": SchemaOrgType.CollectionPage,
      "@id": `${url}#collectionpage`,
      url,
      name,
      description,
      isPartOf: {
        "@id": resolveWebSiteSchemaId(site),
      },
    };

    const itemList = ItemListSchemaBuilder.build(site, {
      items: input.items ?? [],
    });
    if (itemList) {
      page.mainEntity = itemList;
    }

    return Object.freeze(page);
  },
} as const;
