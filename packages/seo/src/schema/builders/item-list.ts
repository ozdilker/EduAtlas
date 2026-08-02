import { CanonicalResolver } from "../../canonical";
import type { JsonLdObject, SeoSiteConfig } from "../../types";
import { SchemaOrgType, type SchemaListInstitutionItem } from "../types";

export const ITEM_LIST_ORDER_ASCENDING = "ItemListOrderAscending" as const;

export type { SchemaListInstitutionItem };

export type ItemListSchemaBuildInput = Readonly<{
  readonly items: readonly SchemaListInstitutionItem[];
}>;

/**
 * Schema.org ItemList — one per CollectionPage when the listing has institutions.
 * Returns null for empty lists (caller must omit mainEntity).
 */
export const ItemListSchemaBuilder = {
  build(
    site: Pick<SeoSiteConfig, "siteUrl">,
    input: ItemListSchemaBuildInput,
  ): JsonLdObject | null {
    const items = normalizeListItems(input.items);
    if (items.length === 0) {
      return null;
    }

    return Object.freeze({
      "@type": SchemaOrgType.ItemList,
      itemListOrder: ITEM_LIST_ORDER_ASCENDING,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) =>
        Object.freeze({
          "@type": SchemaOrgType.ListItem,
          position: index + 1,
          url: CanonicalResolver.resolve({ siteUrl: site.siteUrl, path: item.path }),
          name: item.name,
        }),
      ),
    });
  },
} as const;

export function normalizeListItems(
  items: readonly SchemaListInstitutionItem[] | undefined,
): readonly SchemaListInstitutionItem[] {
  if (!items?.length) {
    return Object.freeze([]);
  }

  return Object.freeze(
    items
      .map((item) => {
        const name = item.name?.trim() ?? "";
        const path = toInstitutionPath(item.path);
        return name && path ? { name, path } : null;
      })
      .filter((item): item is SchemaListInstitutionItem => item !== null),
  );
}

function toInstitutionPath(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
      return new URL(trimmed).pathname || "";
    }
  } catch {
    return "";
  }

  return trimmed.startsWith("/") ? trimmed.split(/[?#]/)[0] ?? "" : `/${trimmed.split(/[?#]/)[0]}`;
}
