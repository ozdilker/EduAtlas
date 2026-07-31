import type {
  EducationCatalogItem,
  EducationCatalogKind,
  EducationCatalogStatus,
} from "@eduatlas/domain";

export type EducationCatalogListOptions = Readonly<{
  readonly status?: EducationCatalogStatus;
  readonly parentId?: string | null;
  readonly query?: string;
}>;

/**
 * Read-only persistence port for a single education catalog collection.
 */
export interface EducationCatalogRepository {
  readonly kind: EducationCatalogKind;
  getById(id: string): Promise<EducationCatalogItem | null>;
  getBySlug(slug: string): Promise<EducationCatalogItem | null>;
  list(options?: EducationCatalogListOptions): Promise<readonly EducationCatalogItem[]>;
}
