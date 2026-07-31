import type { EducationCatalogItem, EducationCatalogKind } from "@eduatlas/domain";
import type {
  EducationCatalogListOptions,
  EducationCatalogRepository,
} from "./education-catalog-repository";

export type ListEducationCatalogItemsInput = EducationCatalogListOptions & {
  kind: EducationCatalogKind;
};

export type ListEducationCatalogItemsDependencies = {
  getRepository: (kind: EducationCatalogKind) => EducationCatalogRepository;
};

/**
 * Read-only: list catalog items for a taxonomy kind.
 */
export async function listEducationCatalogItems(
  input: ListEducationCatalogItemsInput,
  deps: ListEducationCatalogItemsDependencies,
): Promise<readonly EducationCatalogItem[]> {
  const { kind, ...options } = input;
  return deps.getRepository(kind).list(options);
}

export type GetEducationCatalogItemByIdInput = {
  kind: EducationCatalogKind;
  id: string;
};

export async function getEducationCatalogItemById(
  input: GetEducationCatalogItemByIdInput,
  deps: ListEducationCatalogItemsDependencies,
): Promise<EducationCatalogItem | null> {
  const id = input.id.trim();
  if (!id) {
    return null;
  }
  return deps.getRepository(input.kind).getById(id);
}

export type GetEducationCatalogItemBySlugInput = {
  kind: EducationCatalogKind;
  slug: string;
};

export async function getEducationCatalogItemBySlug(
  input: GetEducationCatalogItemBySlugInput,
  deps: ListEducationCatalogItemsDependencies,
): Promise<EducationCatalogItem | null> {
  const slug = input.slug.trim();
  if (!slug) {
    return null;
  }
  return deps.getRepository(input.kind).getBySlug(slug);
}
