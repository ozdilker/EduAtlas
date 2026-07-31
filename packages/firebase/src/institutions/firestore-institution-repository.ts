import type {
  InstitutionListOptions,
  InstitutionPage,
  InstitutionRepository,
  InstitutionSearchQuery,
  InstitutionSearchRepository,
  InstitutionSearchResult,
} from "@eduatlas/application";
import {
  createInstitutionPage,
  DEFAULT_INSTITUTION_PAGE_SIZE,
  DuplicateInstitutionError,
  InstitutionNotFoundError,
  InstitutionSort,
} from "@eduatlas/application";
import {
  createInstitution,
  type Institution,
  type InstitutionId,
  InstitutionStatus,
  institutionIdAsString,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import { FirestoreInstitutionDocumentStore } from "./firestore-institution-document-store";
import { FirestoreInstitutionMapper } from "./firestore-institution-mapper";
import type {
  InstitutionDocumentRecord,
  InstitutionDocumentStore,
} from "./institution-document-store";
import { searchInstitutionsInStore } from "./institution-keyword-search";

export type FirestoreInstitutionRepositoryOptions = {
  firestore?: Firestore;
  store?: InstitutionDocumentStore;
};

/**
 * Firestore adapter for InstitutionRepository + InstitutionSearchRepository.
 * Search returns an empty placeholder until the search index adapter ships.
 */
export class FirestoreInstitutionRepository
  implements InstitutionRepository, InstitutionSearchRepository
{
  private readonly store: InstitutionDocumentStore;

  constructor(options: FirestoreInstitutionRepositoryOptions) {
    if (options.store) {
      this.store = options.store;
    } else if (options.firestore) {
      this.store = new FirestoreInstitutionDocumentStore(options.firestore);
    } else {
      throw new Error("FirestoreInstitutionRepository requires firestore or store.");
    }
  }

  async getById(id: InstitutionId): Promise<Institution | null> {
    const record = await this.store.getById(institutionIdAsString(id));
    return record ? FirestoreInstitutionMapper.toDomain(record.id, record.data) : null;
  }

  async getBySlug(slug: string): Promise<Institution | null> {
    const normalized = slug.trim().toLowerCase();
    const record = await this.store.findBySlug(normalized);
    return record ? FirestoreInstitutionMapper.toDomain(record.id, record.data) : null;
  }

  async list(options: InstitutionListOptions = {}): Promise<InstitutionPage<Institution>> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? DEFAULT_INSTITUTION_PAGE_SIZE;
    const sort = options.sort ?? InstitutionSort.Relevance;
    const filters = options.filters;

    let records: Awaited<ReturnType<InstitutionDocumentStore["listAll"]>>;
    if (filters?.districtId && this.store.listByDistrictId) {
      records = await this.store.listByDistrictId(filters.districtId);
    } else if (filters?.cityId && this.store.listByCityId) {
      records = await this.store.listByCityId(filters.cityId);
    } else if (filters?.primaryType && this.store.listByPrimaryType) {
      records = await this.store.listByPrimaryType(filters.primaryType);
    } else {
      records = await this.store.listAll();
    }
    let institutions = records.map((record) =>
      FirestoreInstitutionMapper.toDomain(record.id, record.data),
    );

    if (filters?.cityId) {
      institutions = institutions.filter((item) => item.location.cityId === filters.cityId);
    }
    if (filters?.districtId) {
      institutions = institutions.filter((item) => item.location.districtId === filters.districtId);
    }
    if (filters?.primaryType) {
      institutions = institutions.filter((item) => item.primaryType === filters.primaryType);
    }
    if (filters?.status) {
      institutions = institutions.filter((item) => item.status === filters.status);
    }
    if (filters?.verification) {
      institutions = institutions.filter((item) => item.verification === filters.verification);
    }
    if (filters?.isPremium !== undefined) {
      institutions = institutions.filter((item) => item.isPremium === filters.isPremium);
    }
    if (filters?.query) {
      const needle = filters.query.toLocaleLowerCase("tr-TR");
      institutions = institutions.filter(
        (item) =>
          item.name.toLocaleLowerCase("tr-TR").includes(needle) ||
          item.slug.toLocaleLowerCase("tr-TR").includes(needle),
      );
    }

    institutions = sortInstitutions(institutions, sort);

    const totalItems = institutions.length;
    const start = (page - 1) * pageSize;
    const items = institutions.slice(start, start + pageSize);

    return createInstitutionPage({
      items,
      page,
      pageSize,
      totalItems,
    });
  }

  async save(institution: Institution): Promise<Institution> {
    const id = FirestoreInstitutionMapper.institutionDocId(institution);
    // Import / create path: no pre-read exists/slug checks (saves Firestore quota).
    // Duplicate detection relies on create() ALREADY_EXISTS + in-file validation.
    try {
      await this.store.create(id, FirestoreInstitutionMapper.toFirestore(institution));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("INSTITUTION_DOC_EXISTS:")) {
        throw new DuplicateInstitutionError({ id: institution.id, slug: institution.slug });
      }
      throw error;
    }

    return institution;
  }

  /**
   * Bulk create for Excel import — WriteBatch, no per-row slug lookups.
   */
  async saveMany(institutions: readonly Institution[]): Promise<readonly Institution[]> {
    if (institutions.length === 0) {
      return Object.freeze([]);
    }

    const entries = institutions.map((institution) => ({
      id: FirestoreInstitutionMapper.institutionDocId(institution),
      data: FirestoreInstitutionMapper.toFirestore(institution),
    }));

    if (this.store.createMany) {
      try {
        await this.store.createMany(entries);
        return Object.freeze([...institutions]);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("INSTITUTION_DOC_EXISTS:")) {
          // Fall back to per-item so one duplicate does not fail the whole chunk.
          const saved: Institution[] = [];
          for (const institution of institutions) {
            try {
              saved.push(await this.save(institution));
            } catch (itemError) {
              if (!(itemError instanceof DuplicateInstitutionError)) {
                throw itemError;
              }
            }
          }
          return Object.freeze(saved);
        }
        throw error;
      }
    }

    const saved: Institution[] = [];
    for (const institution of institutions) {
      saved.push(await this.save(institution));
    }
    return Object.freeze(saved);
  }

  async update(institution: Institution): Promise<Institution> {
    const id = FirestoreInstitutionMapper.institutionDocId(institution);
    const existing = await this.store.getById(id);

    if (!existing) {
      throw new InstitutionNotFoundError({ id: institution.id });
    }

    const slugOwner = await this.store.findBySlug(institution.slug);
    if (slugOwner && slugOwner.id !== id) {
      throw new DuplicateInstitutionError({ slug: institution.slug });
    }

    await this.store.replace(
      id,
      FirestoreInstitutionMapper.toFirestore(institution, {
        leadCounters: institution.leadCounters ?? existing.data.leadCounters,
      }),
    );
    return institution;
  }

  /**
   * Soft-deletes by setting lifecycleStatus to deleted (FIREBASE soft-delete preference).
   */
  async delete(id: InstitutionId): Promise<void> {
    const key = institutionIdAsString(id);
    const existing = await this.store.getById(key);

    if (!existing) {
      throw new InstitutionNotFoundError({ id });
    }

    const institution = FirestoreInstitutionMapper.toDomain(existing.id, existing.data);
    const deleted = createInstitution({
      id: key,
      name: institution.name,
      slug: institution.slug,
      primaryType: institution.primaryType,
      status: InstitutionStatus.Deleted,
      verification: institution.verification,
      location: {
        cityId: institution.location.cityId,
        districtId: institution.location.districtId,
        address: institution.location.address,
        locationNotes: institution.location.locationNotes,
        googleMapsUrl: institution.location.googleMapsUrl,
        latitude: institution.location.latitude,
        longitude: institution.location.longitude,
        geohash: institution.location.geohash,
      },
      contact: {
        phone: institution.contact.phone,
        email: institution.contact.email,
        whatsappNumber: institution.contact.whatsappNumber,
      },
      socialLinks: {
        websiteUrl: institution.socialLinks.websiteUrl,
        facebookUrl: institution.socialLinks.facebookUrl,
        instagramUrl: institution.socialLinks.instagramUrl,
        twitterUrl: institution.socialLinks.twitterUrl,
        youtubeUrl: institution.socialLinks.youtubeUrl,
        linkedinUrl: institution.socialLinks.linkedinUrl,
      },
      shortDescription: institution.shortDescription,
      programsSummary: institution.programsSummary,
      ageOrLevelFocus: institution.ageOrLevelFocus,
      logoUrl: institution.logoUrl,
      coverImageUrl: institution.coverImageUrl,
      galleryImages: institution.galleryImages,
      workingHours: institution.workingHours,
      promoVideoUrl: institution.promoVideoUrl,
      brochurePdfUrl: institution.brochurePdfUrl,
      amenities: institution.amenities,
      educationPrograms: institution.educationPrograms,
      faqs: institution.faqs,
      highlights: institution.highlights,
      isPremium: institution.isPremium,
      qualityScore: institution.qualityScore,
      publishedAt: institution.publishedAt,
      createdAt: institution.createdAt,
      updatedAt: new Date().toISOString(),
      leadCounters: institution.leadCounters,
    });

    await this.store.replace(key, FirestoreInstitutionMapper.toFirestore(deleted));
  }

  /**
   * Keyword search over published institutions (Firestore fallback).
   * Type-only queries use a scoped Firestore read to avoid downloading the full catalog.
   */
  async search(query: InstitutionSearchQuery): Promise<InstitutionSearchResult> {
    const records = await this.loadRecordsForSearch(query);
    return searchInstitutionsInStore(records, query);
  }

  private async loadRecordsForSearch(
    query: InstitutionSearchQuery,
  ): Promise<Awaited<ReturnType<InstitutionDocumentStore["listAll"]>>> {
    const filters = query.filters;
    if (!query.text.trim()) {
      if (filters.districtId && this.store.listByDistrictId) {
        return this.store.listByDistrictId(filters.districtId);
      }

      if (filters.cityId && this.store.listByCityId) {
        return this.store.listByCityId(filters.cityId);
      }

      if (filters.primaryType && this.store.listByPrimaryType) {
        return this.store.listByPrimaryType(filters.primaryType);
      }
    }

    return this.store.listAll();
  }
}
function sortInstitutions(institutions: Institution[], sort: InstitutionSort): Institution[] {
  const copy = [...institutions];

  if (sort === InstitutionSort.NameAsc) {
    copy.sort((left, right) => left.name.localeCompare(right.name, "tr"));
    return copy;
  }

  if (sort === InstitutionSort.NameDesc) {
    copy.sort((left, right) => right.name.localeCompare(left.name, "tr"));
    return copy;
  }

  copy.sort((left, right) => {
    if (right.qualityScore !== left.qualityScore) {
      return right.qualityScore - left.qualityScore;
    }
    return left.name.localeCompare(right.name, "tr");
  });

  return copy;
}

/**
 * Convenience factory for Admin Firestore wiring.
 */
export function createFirestoreInstitutionRepository(
  firestore: Firestore,
): FirestoreInstitutionRepository {
  return new FirestoreInstitutionRepository({ firestore });
}
