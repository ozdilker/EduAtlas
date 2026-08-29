import type {
  InstitutionAdminListFilters,
  InstitutionAdminListPage,
  InstitutionAdminListPageInput,
  InstitutionAdminListSort,
  InstitutionListOptions,
  InstitutionPage,
  InstitutionPublishedBrowsePage,
  InstitutionRepository,
  InstitutionSearchQuery,
  InstitutionSearchRepository,
  InstitutionSearchResult,
} from "@eduatlas/application";
import {
  createInstitutionPage,
  createInstitutionSearchResult,
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
  InstitutionVerification,
  institutionIdAsString,
} from "@eduatlas/domain";
import type { Firestore } from "firebase-admin/firestore";
import {
  decodeAdminInstitutionListCursor,
  encodeAdminInstitutionListCursor,
} from "./admin-institution-list-cursor";
import { FirestoreInstitutionDocumentStore } from "./firestore-institution-document-store";
import {
  FirestoreInstitutionMapper,
  googleBusinessFromDocument,
} from "./firestore-institution-mapper";
import type {
  AdminListFilters,
  AdminListSort,
  InstitutionDocumentStore,
} from "./institution-document-store";
import {
  searchInstitutionsInStore,
  toSearchDocumentsFromRecords,
} from "./institution-keyword-search";
import {
  decodePublishedBrowseCursor,
  encodePublishedBrowseCursor,
} from "./published-browse-cursor";

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

  /**
   * Public /institutions browse — Firestore limit + startAfter cursor (no listAll).
   */
  async listPublishedBrowsePage(input: {
    pageSize: number;
    cursor?: string | null;
  }): Promise<InstitutionPublishedBrowsePage> {
    const pageSize = Math.max(1, Math.min(100, Math.floor(input.pageSize)));
    if (!this.store.listPublishedBrowsePage || !this.store.countPublished) {
      throw new Error(
        "InstitutionDocumentStore.listPublishedBrowsePage/countPublished required for public browse.",
      );
    }

    const cursor = decodePublishedBrowseCursor(input.cursor);
    const [page, totalPublished] = await Promise.all([
      this.store.listPublishedBrowsePage({
        limit: pageSize,
        cursor,
      }),
      this.store.countPublished(),
    ]);

    const items = page.records.map((record) =>
      FirestoreInstitutionMapper.toDomain(record.id, record.data),
    );
    const nextCursor = page.nextCursor ? encodePublishedBrowseCursor(page.nextCursor) : null;

    return Object.freeze({
      items: Object.freeze(items),
      pageSize,
      nextCursor,
      totalPublished,
    });
  }

  /**
   * Empty-text / structured-filter search — bounded Firestore query (no listAll).
   * Free-text search must not call this path.
   */
  private async searchStructuredPublished(
    query: InstitutionSearchQuery,
  ): Promise<InstitutionSearchResult> {
    if (!this.store.listPublishedBrowsePage || !this.store.countPublished) {
      throw new Error(
        "InstitutionDocumentStore.listPublishedBrowsePage/countPublished required for structured search.",
      );
    }

    const browseFilters = toPublishedBrowseFilters(query);

    const cursor = decodePublishedBrowseCursor(query.cursor);
    const [page, totalPublished] = await Promise.all([
      this.store.listPublishedBrowsePage({
        limit: query.pageSize,
        cursor,
        filters: browseFilters,
      }),
      this.store.countPublished(browseFilters),
    ]);

    let items = toSearchDocumentsFromRecords(page.records);

    // verified / premium are not part of the bounded Firestore query yet — apply on the page.
    if (query.filters.verification) {
      items = items.filter((item) => item.verification === query.filters.verification);
    }
    if (query.filters.isPremium !== undefined) {
      items = items.filter((item) => item.isPremium === query.filters.isPremium);
    }

    if (query.sort === InstitutionSort.NameAsc) {
      items = [...items].sort(
        (left, right) =>
          left.name.localeCompare(right.name, "tr") || left.id.localeCompare(right.id),
      );
    } else if (query.sort === InstitutionSort.NameDesc) {
      items = [...items].sort(
        (left, right) =>
          right.name.localeCompare(left.name, "tr") || left.id.localeCompare(right.id),
      );
    }

    const nextCursor = page.nextCursor ? encodePublishedBrowseCursor(page.nextCursor) : null;

    return createInstitutionSearchResult({
      query,
      items,
      totalItems: totalPublished,
      nextCursor,
    });
  }

  /**
   * Admin UI listing — Firestore limit + startAfter cursor (never listAll).
   */
  async listAdminPage(input: InstitutionAdminListPageInput): Promise<InstitutionAdminListPage> {
    const pageSize = Math.max(1, Math.min(500, Math.floor(input.pageSize)));
    const sort: InstitutionAdminListSort = input.sort ?? "name_asc";
    if (!this.store.listAdminPage || !this.store.countAdmin) {
      throw new Error(
        "InstitutionDocumentStore.listAdminPage/countAdmin required for admin listing.",
      );
    }

    const storeFilters = toAdminStoreFilters(input.filters);
    const cursor = decodeAdminInstitutionListCursor(input.cursor, sort);
    const [page, totalItems] = await Promise.all([
      this.store.listAdminPage({
        limit: pageSize,
        sort: sort as AdminListSort,
        cursor,
        filters: storeFilters,
      }),
      this.store.countAdmin(storeFilters),
    ]);

    const items = page.records.map((record) =>
      FirestoreInstitutionMapper.toDomain(record.id, record.data),
    );
    const nextCursor = page.nextCursor ? encodeAdminInstitutionListCursor(page.nextCursor) : null;

    return Object.freeze({
      items: Object.freeze(items),
      pageSize,
      nextCursor,
      hasNextPage: Boolean(nextCursor),
      totalItems,
    });
  }

  /**
   * Admin filtered count via Firestore aggregation (no document download).
   */
  async countAdmin(filters?: InstitutionAdminListFilters): Promise<number> {
    if (!this.store.countAdmin) {
      throw new Error("InstitutionDocumentStore.countAdmin required for admin counts.");
    }
    return this.store.countAdmin(toAdminStoreFilters(filters));
  }

  /**
   * Sum of stored qualityScore for acquisition average KPIs (no document download).
   */
  async sumAdminQualityScore(
    filters?: InstitutionAdminListFilters,
  ): Promise<{ count: number; sum: number }> {
    if (!this.store.sumAdminQualityScore) {
      throw new Error(
        "InstitutionDocumentStore.sumAdminQualityScore required for acquisition quality averages.",
      );
    }
    return this.store.sumAdminQualityScore(toAdminStoreFilters(filters));
  }

  async findByContactEmail(
    email: string,
    options?: { readonly limit?: number },
  ): Promise<readonly Institution[]> {
    const limit = Math.max(1, Math.min(20, options?.limit ?? 5));
    if (!this.store.findByContactEmail) return Object.freeze([]);
    const records = await this.store.findByContactEmail(email, limit);
    return Object.freeze(
      records.map((record) => FirestoreInstitutionMapper.toDomain(record.id, record.data)),
    );
  }

  async findByExactName(
    name: string,
    options?: {
      readonly cityId?: string;
      readonly districtId?: string;
      readonly limit?: number;
    },
  ): Promise<readonly Institution[]> {
    const limit = Math.max(1, Math.min(20, options?.limit ?? 10));
    if (!this.store.findByExactName) return Object.freeze([]);
    const records = await this.store.findByExactName({
      name: name.trim(),
      ...(options?.cityId ? { cityId: options.cityId } : {}),
      ...(options?.districtId ? { districtId: options.districtId } : {}),
      limit,
    });
    return Object.freeze(
      records.map((record) => FirestoreInstitutionMapper.toDomain(record.id, record.data)),
    );
  }

  /**
   * Published institutions in a city with a Firestore-level limit (related cards).
   * Does not use unbounded listByCityId.
   */
  async listRelatedPublishedByCity(cityId: string, limit: number): Promise<readonly Institution[]> {
    const capped = Math.max(0, Math.floor(limit));
    if (!cityId.trim() || capped === 0) {
      return Object.freeze([]);
    }

    if (!this.store.listPublishedByCityIdLimited) {
      throw new Error(
        "InstitutionDocumentStore.listPublishedByCityIdLimited is required for related institution queries.",
      );
    }

    const records = await this.store.listPublishedByCityIdLimited(cityId.trim(), capped);
    return Object.freeze(
      records.map((record) => FirestoreInstitutionMapper.toDomain(record.id, record.data)),
    );
  }

  async list(options: InstitutionListOptions = {}): Promise<InstitutionPage<Institution>> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? DEFAULT_INSTITUTION_PAGE_SIZE;
    const sort = options.sort ?? InstitutionSort.Relevance;
    const filters = options.filters;

    // Admin free-text must never trigger nationwide listAll() without structured scope.
    const hasFreeText = Boolean(filters?.query?.trim());
    const hasFreeTextScope = Boolean(
      filters?.cityId?.trim() || filters?.districtId?.trim() || filters?.primaryType,
    );
    if (hasFreeText && !hasFreeTextScope) {
      return createInstitutionPage({
        items: [],
        page,
        pageSize,
        totalItems: 0,
      });
    }

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
        googleBusiness: institution.googleBusiness ?? googleBusinessFromDocument(existing.data),
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
      googleBusiness: institution.googleBusiness,
    });

    await this.store.replace(key, FirestoreInstitutionMapper.toFirestore(deleted));
  }

  /**
   * Keyword search over published institutions (Firestore fallback).
   * Empty-text / structured filters use a bounded published query (no listAll).
   * Free-text with city/district/type loads published candidates for that scope only
   * (no nationwide listAll). Unfiltered free-text still uses listAll().
   */
  async search(query: InstitutionSearchQuery): Promise<InstitutionSearchResult> {
    if (!query.text.trim()) {
      return this.searchStructuredPublished(query);
    }

    const records = await this.loadRecordsForSearch(query);
    return searchInstitutionsInStore(records, query);
  }

  /**
   * Free-text candidate loader.
   * With structured scope → published + filters in Firestore (no listAll).
   * Without structured scope → legacy listAll() (unchanged; separate future task).
   */
  private async loadRecordsForSearch(
    query: InstitutionSearchQuery,
  ): Promise<Awaited<ReturnType<InstitutionDocumentStore["listAll"]>>> {
    const browseFilters = toPublishedBrowseFilters(query);
    if (hasPublishedBrowseScope(browseFilters)) {
      if (!this.store.listPublishedCandidates) {
        throw new Error(
          "InstitutionDocumentStore.listPublishedCandidates required for scoped free-text search.",
        );
      }
      return this.store.listPublishedCandidates(browseFilters);
    }

    return this.store.listAll();
  }
}

function toPublishedBrowseFilters(query: InstitutionSearchQuery): {
  cityId?: string;
  districtId?: string;
  primaryTypeId?: string;
} {
  return {
    ...(query.filters.cityId ? { cityId: query.filters.cityId } : {}),
    ...(query.filters.districtId ? { districtId: query.filters.districtId } : {}),
    ...(query.filters.primaryType ? { primaryTypeId: query.filters.primaryType } : {}),
  };
}

function hasPublishedBrowseScope(filters: {
  cityId?: string;
  districtId?: string;
  primaryTypeId?: string;
}): boolean {
  return Boolean(filters.cityId || filters.districtId || filters.primaryTypeId);
}

function toAdminStoreFilters(filters?: InstitutionAdminListFilters): AdminListFilters {
  const claimStatusIn = filters?.verifications?.map(verificationToClaimStatus);
  return {
    ...(filters?.status ? { lifecycleStatus: filters.status } : {}),
    ...(filters?.cityId?.trim() ? { cityId: filters.cityId.trim() } : {}),
    ...(filters?.districtId?.trim() ? { districtId: filters.districtId.trim() } : {}),
    ...(filters?.primaryType ? { primaryTypeId: filters.primaryType } : {}),
    ...(filters?.verification
      ? { claimStatus: verificationToClaimStatus(filters.verification) }
      : !filters?.verification && claimStatusIn && claimStatusIn.length > 0
        ? { claimStatusIn }
        : {}),
    ...(filters?.isPremium !== undefined ? { isPremium: filters.isPremium } : {}),
    ...(typeof filters?.qualityScoreMin === "number"
      ? { qualityScoreMin: filters.qualityScoreMin }
      : {}),
    ...(typeof filters?.qualityScoreMaxExclusive === "number"
      ? { qualityScoreMaxExclusive: filters.qualityScoreMaxExclusive }
      : {}),
  };
}

function verificationToClaimStatus(verification: InstitutionVerification): string {
  if (verification === InstitutionVerification.Verified) {
    return "claimed";
  }
  return verification;
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
