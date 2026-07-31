import {
  createEducationCatalogItem,
  type EducationCatalogItem,
  type EducationCatalogKind,
  educationCatalogCollectionId,
  educationCatalogItemIdAsString,
} from "@eduatlas/domain";
import type { FirestoreEducationCatalogDocument } from "./firestore-education-catalog-document";

export const FirestoreEducationCatalogMapper = {
  toDomain(
    id: string,
    kind: EducationCatalogKind,
    data: FirestoreEducationCatalogDocument,
  ): EducationCatalogItem {
    return createEducationCatalogItem({
      id,
      kind,
      slug: data.slug,
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      order: data.order,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  },

  toFirestore(item: EducationCatalogItem): FirestoreEducationCatalogDocument {
    return {
      kind: item.kind,
      slug: item.slug,
      name: item.name,
      description: item.description,
      ...(item.parentId ? { parentId: educationCatalogItemIdAsString(item.parentId) } : {}),
      order: item.order,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  },

  docId(item: EducationCatalogItem): string {
    return educationCatalogItemIdAsString(item.id);
  },

  collectionId(kind: EducationCatalogKind): string {
    return educationCatalogCollectionId(kind);
  },
};
