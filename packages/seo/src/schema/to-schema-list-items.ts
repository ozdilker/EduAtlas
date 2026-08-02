import { normalizeListItems, type SchemaListInstitutionItem } from "./builders/item-list";

/**
 * Maps UI institution cards (name + href) into SchemaEngine list items.
 * Does not fetch — only reshapes data already on the page.
 */
export function toSchemaListItems(
  cards: readonly { name: string; href: string }[] | undefined,
): readonly SchemaListInstitutionItem[] {
  if (!cards?.length) {
    return Object.freeze([]);
  }

  return normalizeListItems(
    cards.map((card) => ({
      name: card.name,
      path: card.href,
    })),
  );
}
