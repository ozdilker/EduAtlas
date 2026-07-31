import type {
  EducationCatalogListOptions,
  EducationCatalogRepository,
} from "@eduatlas/application";
import {
  type EducationCatalogItem,
  type EducationCatalogKind,
  EducationCatalogStatus,
  educationCatalogCollectionId,
  foldTurkishText,
  normalizeGeographySlug,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import type { EducationCatalogDocumentStore } from "./education-catalog-document-store";
import { FirestoreEducationCatalogDocumentStore } from "./firestore-education-catalog-document-store";
import { FirestoreEducationCatalogMapper } from "./firestore-education-catalog-mapper";

export type FirestoreEducationCatalogRepositoryOptions = {
  kind: EducationCatalogKind;
  firestore?: Firestore;
  store?: EducationCatalogDocumentStore;
};

/**
 * Firestore adapter for EducationCatalogRepository (read-oriented; upsert for seeding).
 */
export class FirestoreEducationCatalogRepository implements EducationCatalogRepository {
  readonly kind: EducationCatalogKind;
  private readonly store: EducationCatalogDocumentStore;

  constructor(options: FirestoreEducationCatalogRepositoryOptions) {
    this.kind = options.kind;
    if (options.store) {
      this.store = options.store;
    } else if (options.firestore) {
      this.store = new FirestoreEducationCatalogDocumentStore(
        options.firestore,
        educationCatalogCollectionId(options.kind),
      );
    } else {
      throw new Error("FirestoreEducationCatalogRepository requires firestore or store.");
    }
  }

  async getById(id: string): Promise<EducationCatalogItem | null> {
    const record = await this.store.getById(id.trim());
    if (!record) {
      return null;
    }
    try {
      return FirestoreEducationCatalogMapper.toDomain(record.id, this.kind, record.data);
    } catch {
      return null;
    }
  }

  async getBySlug(slug: string): Promise<EducationCatalogItem | null> {
    const record = await this.store.findBySlug(normalizeGeographySlug(slug));
    if (!record) {
      return null;
    }
    try {
      return FirestoreEducationCatalogMapper.toDomain(record.id, this.kind, record.data);
    } catch {
      return null;
    }
  }

  async list(options: EducationCatalogListOptions = {}): Promise<readonly EducationCatalogItem[]> {
    const records = await this.store.listAll();
    let items = records.flatMap((record) => {
      try {
        return [FirestoreEducationCatalogMapper.toDomain(record.id, this.kind, record.data)];
      } catch {
        return [];
      }
    });

    if (options.status) {
      items = items.filter((item) => item.status === options.status);
    } else {
      items = items.filter((item) => item.status === EducationCatalogStatus.Published);
    }

    if (options.parentId === null) {
      items = items.filter((item) => !item.parentId);
    } else if (typeof options.parentId === "string" && options.parentId.trim()) {
      const parentId = options.parentId.trim();
      items = items.filter((item) => item.parentId?.value === parentId);
    }

    if (options.query?.trim()) {
      const q = foldTurkishText(options.query);
      items = items.filter(
        (item) =>
          foldTurkishText(item.name).includes(q) ||
          item.slug.includes(q) ||
          foldTurkishText(item.description).includes(q),
      );
    }

    items.sort(
      (left, right) => left.order - right.order || left.name.localeCompare(right.name, "tr"),
    );
    return Object.freeze(items);
  }

  async upsert(item: EducationCatalogItem): Promise<EducationCatalogItem> {
    if (item.kind !== this.kind) {
      throw new Error(`Catalog item kind ${item.kind} does not match repository ${this.kind}.`);
    }
    await this.store.upsert(
      FirestoreEducationCatalogMapper.docId(item),
      FirestoreEducationCatalogMapper.toFirestore(item),
    );
    return item;
  }
}

export function createFirestoreEducationCatalogRepository(
  firestore: Firestore,
  kind: EducationCatalogKind,
): FirestoreEducationCatalogRepository {
  return new FirestoreEducationCatalogRepository({ firestore, kind });
}
