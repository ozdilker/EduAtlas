import { foldTurkishText } from "@eduatlas/domain";
import type { FirestoreInstitutionDocument } from "./firestore-institution-document";
import type {
  AdminListCursor,
  AdminListFilters,
  AdminListSort,
  InstitutionDocumentRecord,
  InstitutionDocumentStore,
  PublishedBrowseFilters,
} from "./institution-document-store";
import {
  INSTITUTION_EXACT_NAME_STORE_CAP,
  INSTITUTION_KEYWORD_STORE_CAP,
} from "./institution-search-store-caps";

/**
 * In-memory InstitutionDocumentStore for contract tests (no Firebase emulator required).
 */
export class InMemoryInstitutionDocumentStore implements InstitutionDocumentStore {
  private readonly documents = new Map<string, FirestoreInstitutionDocument>();

  async getById(id: string): Promise<InstitutionDocumentRecord | null> {
    const data = this.documents.get(id);
    return data ? { id, data: structuredClone(data) } : null;
  }

  async findBySlug(slug: string): Promise<InstitutionDocumentRecord | null> {
    for (const [id, data] of this.documents.entries()) {
      if (data.slug === slug) {
        return { id, data: structuredClone(data) };
      }
    }
    return null;
  }

  async listAll(): Promise<InstitutionDocumentRecord[]> {
    return [...this.documents.entries()].map(([id, data]) => ({
      id,
      data: structuredClone(data),
    }));
  }

  async listByPrimaryType(primaryTypeId: string): Promise<InstitutionDocumentRecord[]> {
    const typeId = primaryTypeId.trim();
    return [...this.documents.entries()]
      .filter(([, data]) => data.primaryTypeId === typeId)
      .map(([id, data]) => ({
        id,
        data: structuredClone(data),
      }));
  }

  async listByCityId(cityId: string): Promise<InstitutionDocumentRecord[]> {
    const normalized = cityId.trim();
    if (!normalized) {
      return [];
    }

    return [...this.documents.entries()]
      .filter(([, data]) => data.cityId === normalized)
      .map(([id, data]) => ({
        id,
        data: structuredClone(data),
      }));
  }

  async listByDistrictId(districtId: string): Promise<InstitutionDocumentRecord[]> {
    const normalized = districtId.trim();
    if (!normalized) {
      return [];
    }

    return [...this.documents.entries()]
      .filter(([, data]) => data.districtId === normalized)
      .map(([id, data]) => ({
        id,
        data: structuredClone(data),
      }));
  }

  async listPublishedBrowsePage(input: {
    limit: number;
    cursor?: { qualityScore: number; id: string } | null;
    filters?: PublishedBrowseFilters;
  }): Promise<{
    records: InstitutionDocumentRecord[];
    nextCursor: { qualityScore: number; id: string } | null;
  }> {
    const capped = Math.max(0, Math.floor(input.limit));
    if (capped === 0) {
      return { records: [], nextCursor: null };
    }

    const sorted = [...this.documents.entries()]
      .filter(([, data]) => matchesPublishedBrowseFilters(data, input.filters))
      .sort((left, right) => {
        const scoreDiff = (right[1].qualityScore ?? 0) - (left[1].qualityScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return left[0].localeCompare(right[0]);
      });

    let start = 0;
    const browseCursor = input.cursor;
    if (browseCursor?.id) {
      const index = sorted.findIndex(
        ([id, data]) =>
          (data.qualityScore ?? 0) === browseCursor.qualityScore && id === browseCursor.id,
      );
      start = index >= 0 ? index + 1 : sorted.length;
    }

    const slice = sorted.slice(start, start + capped);
    const records = slice.map(([id, data]) => ({
      id,
      data: structuredClone(data),
    }));
    const last = records[records.length - 1];
    const nextCursor =
      records.length === capped && last
        ? { qualityScore: last.data.qualityScore ?? 0, id: last.id }
        : null;

    return { records, nextCursor };
  }

  async countPublished(filters?: PublishedBrowseFilters): Promise<number> {
    let count = 0;
    for (const data of this.documents.values()) {
      if (matchesPublishedBrowseFilters(data, filters)) count += 1;
    }
    return count;
  }

  async listPublishedCandidates(
    filters: PublishedBrowseFilters,
  ): Promise<InstitutionDocumentRecord[]> {
    const cityId = filters.cityId?.trim();
    const districtId = filters.districtId?.trim();
    const primaryTypeId = filters.primaryTypeId?.trim();
    if (!cityId && !districtId && !primaryTypeId) {
      throw new Error(
        "listPublishedCandidates requires at least one of cityId, districtId, primaryTypeId.",
      );
    }

    return [...this.documents.entries()]
      .filter(([, data]) => matchesPublishedBrowseFilters(data, filters))
      .map(([id, data]) => ({
        id,
        data: structuredClone(data),
      }));
  }

  async listPublishedByCityIdLimited(
    cityId: string,
    limit: number,
  ): Promise<InstitutionDocumentRecord[]> {
    const normalized = cityId.trim();
    const capped = Math.max(0, Math.floor(limit));
    if (!normalized || capped === 0) {
      return [];
    }

    return [...this.documents.entries()]
      .filter(([, data]) => data.cityId === normalized && data.lifecycleStatus === "published")
      .sort((left, right) => {
        const scoreDiff = (right[1].qualityScore ?? 0) - (left[1].qualityScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return left[1].name.localeCompare(right[1].name, "tr");
      })
      .slice(0, capped)
      .map(([id, data]) => ({
        id,
        data: structuredClone(data),
      }));
  }

  async listAdminPage(input: {
    limit: number;
    sort: AdminListSort;
    cursor?: AdminListCursor | null;
    filters?: AdminListFilters;
  }): Promise<{
    records: InstitutionDocumentRecord[];
    nextCursor: AdminListCursor | null;
  }> {
    const capped = Math.max(0, Math.floor(input.limit));
    if (capped === 0) {
      return { records: [], nextCursor: null };
    }

    const sorted = [...this.documents.entries()]
      .filter(([, data]) => matchesAdminListFilters(data, input.filters))
      .sort((left, right) => compareAdminSort(left, right, input.sort));

    let start = 0;
    const cursorId = input.cursor?.id;
    if (cursorId && input.cursor?.sort === input.sort) {
      const index = sorted.findIndex(([id]) => id === cursorId);
      start = index >= 0 ? index + 1 : sorted.length;
    }

    const slice = sorted.slice(start, start + capped);
    const records = slice.map(([id, data]) => ({
      id,
      data: structuredClone(data),
    }));
    const last = records[records.length - 1];
    const nextCursor =
      records.length === capped && last ? toInMemoryAdminCursor(input.sort, last) : null;

    return { records, nextCursor };
  }

  async countAdmin(filters?: AdminListFilters): Promise<number> {
    let count = 0;
    for (const data of this.documents.values()) {
      if (matchesAdminListFilters(data, filters)) count += 1;
    }
    return count;
  }

  async sumAdminQualityScore(filters?: AdminListFilters): Promise<{ count: number; sum: number }> {
    let count = 0;
    let sum = 0;
    for (const data of this.documents.values()) {
      if (!matchesAdminListFilters(data, filters)) continue;
      count += 1;
      sum += data.qualityScore ?? 0;
    }
    return { count, sum };
  }

  async create(id: string, data: FirestoreInstitutionDocument): Promise<void> {
    if (this.documents.has(id)) {
      throw new Error(`INSTITUTION_DOC_EXISTS:${id}`);
    }
    this.documents.set(id, structuredClone(data));
  }

  async createMany(
    entries: readonly { id: string; data: FirestoreInstitutionDocument }[],
  ): Promise<void> {
    for (const entry of entries) {
      await this.create(entry.id, entry.data);
    }
  }

  async replace(id: string, data: FirestoreInstitutionDocument): Promise<void> {
    this.documents.set(id, structuredClone(data));
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async findByContactEmail(email: string, limit: number): Promise<InstitutionDocumentRecord[]> {
    const needle = email.trim().toLowerCase();
    const capped = Math.max(0, Math.min(Math.floor(limit), 20));
    if (!needle || capped === 0) return [];
    const hits: InstitutionDocumentRecord[] = [];
    for (const [id, data] of this.documents.entries()) {
      if ((data.contactEmail ?? "").trim().toLowerCase() !== needle) continue;
      hits.push({ id, data: structuredClone(data) });
      if (hits.length >= capped) break;
    }
    return hits;
  }

  async findByExactName(input: {
    name: string;
    cityId?: string;
    districtId?: string;
    limit: number;
  }): Promise<InstitutionDocumentRecord[]> {
    const nameNeedle = foldTurkishText(input.name.trim());
    const capped = Math.max(0, Math.min(Math.floor(input.limit), INSTITUTION_EXACT_NAME_STORE_CAP));
    const cityId = input.cityId?.trim();
    const districtId = input.districtId?.trim();
    if (!nameNeedle || capped === 0) return [];
    const hits: InstitutionDocumentRecord[] = [];
    for (const [id, data] of this.documents.entries()) {
      const folded = (data.nameFolded ?? foldTurkishText(data.name)).trim();
      if (folded !== nameNeedle) continue;
      if (cityId && data.cityId !== cityId) continue;
      if (districtId && data.districtId !== districtId) continue;
      hits.push({ id, data: structuredClone(data) });
      if (hits.length >= capped) break;
    }
    return hits;
  }

  async findBySearchKeyword(input: {
    keyword: string;
    cityId?: string;
    districtId?: string;
    limit: number;
  }): Promise<InstitutionDocumentRecord[]> {
    const keyword = foldTurkishText(input.keyword.trim());
    const capped = Math.max(0, Math.min(Math.floor(input.limit), INSTITUTION_KEYWORD_STORE_CAP));
    const cityId = input.cityId?.trim();
    const districtId = input.districtId?.trim();
    if (!keyword || capped === 0) return [];
    const hits: InstitutionDocumentRecord[] = [];
    for (const [id, data] of this.documents.entries()) {
      const keywords = (data.searchKeywords ?? []).map((token) => foldTurkishText(token));
      if (!keywords.includes(keyword)) continue;
      if (cityId && data.cityId !== cityId) continue;
      if (districtId && data.districtId !== districtId) continue;
      hits.push({ id, data: structuredClone(data) });
      if (hits.length >= capped) break;
    }
    return hits;
  }

  async exists(id: string): Promise<boolean> {
    return this.documents.has(id);
  }
}

function matchesPublishedBrowseFilters(
  data: FirestoreInstitutionDocument,
  filters?: PublishedBrowseFilters,
): boolean {
  if (data.lifecycleStatus !== "published") return false;
  const cityId = filters?.cityId?.trim();
  const districtId = filters?.districtId?.trim();
  const primaryTypeId = filters?.primaryTypeId?.trim();
  if (cityId && data.cityId !== cityId) return false;
  if (districtId && data.districtId !== districtId) return false;
  if (primaryTypeId && data.primaryTypeId !== primaryTypeId) return false;
  return true;
}

function matchesAdminListFilters(
  data: FirestoreInstitutionDocument,
  filters?: AdminListFilters,
): boolean {
  const lifecycleStatus = filters?.lifecycleStatus?.trim();
  const cityId = filters?.cityId?.trim();
  const districtId = filters?.districtId?.trim();
  const primaryTypeId = filters?.primaryTypeId?.trim();
  const claimStatus = filters?.claimStatus?.trim();
  const claimStatusIn = filters?.claimStatusIn?.map((item) => item.trim()).filter(Boolean);
  if (lifecycleStatus && data.lifecycleStatus !== lifecycleStatus) return false;
  if (cityId && data.cityId !== cityId) return false;
  if (districtId && data.districtId !== districtId) return false;
  if (primaryTypeId && data.primaryTypeId !== primaryTypeId) return false;
  if (claimStatus) {
    if (data.claimStatus !== claimStatus) return false;
  } else if (
    claimStatusIn &&
    claimStatusIn.length > 0 &&
    !claimStatusIn.includes(data.claimStatus)
  ) {
    return false;
  }
  if (filters?.isPremium !== undefined && Boolean(data.isPremium) !== filters.isPremium) {
    return false;
  }
  const score = data.qualityScore ?? 0;
  if (typeof filters?.qualityScoreMin === "number" && score < filters.qualityScoreMin) {
    return false;
  }
  if (
    typeof filters?.qualityScoreMaxExclusive === "number" &&
    score >= filters.qualityScoreMaxExclusive
  ) {
    return false;
  }
  return true;
}

function compareAdminSort(
  left: [string, FirestoreInstitutionDocument],
  right: [string, FirestoreInstitutionDocument],
  sort: AdminListSort,
): number {
  const [leftId, leftData] = left;
  const [rightId, rightData] = right;
  switch (sort) {
    case "name_desc": {
      const byName = rightData.name.localeCompare(leftData.name, "tr");
      return byName !== 0 ? byName : leftId.localeCompare(rightId);
    }
    case "created_desc": {
      const byCreated = rightData.createdAt.localeCompare(leftData.createdAt);
      return byCreated !== 0 ? byCreated : leftId.localeCompare(rightId);
    }
    case "quality_desc": {
      const byScore = (rightData.qualityScore ?? 0) - (leftData.qualityScore ?? 0);
      return byScore !== 0 ? byScore : leftId.localeCompare(rightId);
    }
    case "quality_asc": {
      const byScore = (leftData.qualityScore ?? 0) - (rightData.qualityScore ?? 0);
      return byScore !== 0 ? byScore : leftId.localeCompare(rightId);
    }
    default: {
      const byName = leftData.name.localeCompare(rightData.name, "tr");
      return byName !== 0 ? byName : leftId.localeCompare(rightId);
    }
  }
}

function toInMemoryAdminCursor(
  sort: AdminListSort,
  record: InstitutionDocumentRecord,
): AdminListCursor {
  switch (sort) {
    case "name_desc":
    case "name_asc":
      return { sort, name: record.data.name, id: record.id };
    case "created_desc":
      return { sort, createdAt: record.data.createdAt, id: record.id };
    case "quality_desc":
    case "quality_asc":
      return { sort, qualityScore: record.data.qualityScore ?? 0, id: record.id };
    default:
      return { sort: "name_asc", name: record.data.name, id: record.id };
  }
}
