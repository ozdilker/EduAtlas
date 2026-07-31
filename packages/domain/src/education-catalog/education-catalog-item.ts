import { assertValidGeographySlug, normalizeGeographySlug } from "../geography/geography-slug";
import {
  createEducationCatalogItemId,
  type EducationCatalogItemId,
  educationCatalogItemIdAsString,
} from "./education-catalog-item-id";
import { type EducationCatalogKind, parseEducationCatalogKind } from "./education-catalog-kind";
import { EducationCatalogStatus, parseEducationCatalogStatus } from "./education-catalog-status";

/**
 * Shared education taxonomy catalog item (read-model foundation).
 */
export type EducationCatalogItem = Readonly<{
  readonly id: EducationCatalogItemId;
  readonly kind: EducationCatalogKind;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly parentId?: EducationCatalogItemId;
  readonly order: number;
  readonly status: EducationCatalogStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type CreateEducationCatalogItemInput = {
  id: string;
  kind: EducationCatalogKind | string;
  slug: string;
  name: string;
  description: string;
  parentId?: string;
  order?: number;
  status?: EducationCatalogStatus | string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Creates an immutable education catalog item.
 */
export function createEducationCatalogItem(
  input: CreateEducationCatalogItemInput,
): EducationCatalogItem {
  const id = createEducationCatalogItemId(input.id);
  const kind = typeof input.kind === "string" ? parseEducationCatalogKind(input.kind) : input.kind;
  const slug = normalizeGeographySlug(input.slug);
  const name = input.name.trim();
  const description = input.description.trim();
  const parentId = input.parentId?.trim()
    ? createEducationCatalogItemId(input.parentId)
    : undefined;
  const order = input.order ?? 0;
  const status = input.status
    ? typeof input.status === "string"
      ? parseEducationCatalogStatus(input.status)
      : input.status
    : EducationCatalogStatus.Published;

  if (!name) {
    throw new Error("EducationCatalogItem.name is required.");
  }
  if (!description) {
    throw new Error("EducationCatalogItem.description is required.");
  }
  assertValidGeographySlug(slug, "EducationCatalogItem.slug");
  if (!Number.isInteger(order) || order < 0) {
    throw new Error("EducationCatalogItem.order must be a non-negative integer.");
  }
  if (parentId && educationCatalogItemIdAsString(parentId) === educationCatalogItemIdAsString(id)) {
    throw new Error("EducationCatalogItem.parentId cannot equal id.");
  }
  assertIsoTimestamp(input.createdAt, "createdAt");
  assertIsoTimestamp(input.updatedAt, "updatedAt");

  return Object.freeze({
    id,
    kind,
    slug,
    name,
    description,
    ...(parentId ? { parentId } : {}),
    order,
    status,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

function assertIsoTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`EducationCatalogItem.${field} must be an ISO timestamp.`);
  }
}
