import { EDUCATION_CATALOG_KINDS, type EducationCatalogKind } from "@eduatlas/domain";
import type { EducationCatalogRepository } from "./education-catalog-repository";
import { listEducationCatalogItems } from "./list-education-catalog-items";

export type EducationCatalogSummary = Readonly<{
  readonly kinds: readonly EducationCatalogKind[];
  readonly countsByKind: Readonly<Record<EducationCatalogKind, number>>;
  readonly totalItems: number;
  readonly note: string;
}>;

export type GetEducationCatalogSummaryDependencies = {
  getRepository: (kind: EducationCatalogKind) => EducationCatalogRepository;
};

/**
 * Read-only summary across all education catalog collections.
 */
export async function getEducationCatalogSummary(
  deps: GetEducationCatalogSummaryDependencies,
): Promise<EducationCatalogSummary> {
  const counts = {} as Record<EducationCatalogKind, number>;
  let totalItems = 0;

  for (const kind of EDUCATION_CATALOG_KINDS) {
    const items = await listEducationCatalogItems({ kind }, deps);
    counts[kind] = items.length;
    totalItems += items.length;
  }

  return Object.freeze({
    kinds: EDUCATION_CATALOG_KINDS,
    countsByKind: Object.freeze(counts),
    totalItems,
    note: "Education taxonomy catalogs only. No institutions attached yet.",
  });
}
