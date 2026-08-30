import type { InstitutionSearchQuery, InstitutionSearchResult } from "@eduatlas/application";
import {
  createInstitutionSearchResult,
  InstitutionSort,
  scoreInstitutionNameSearch,
} from "@eduatlas/application/institutions";
import {
  createPublishedSearchDocument,
  foldTurkishText,
  type Institution,
  type InstitutionSearchDocument,
  InstitutionStatus,
  institutionIdAsString,
  tokenizeInstitutionSearchKeywords,
} from "@eduatlas/domain";
import { resolveGeoLabels } from "../seeds/geo-catalog";
import type { FirestoreInstitutionDocument } from "./firestore-institution-document";
import { FirestoreInstitutionMapper } from "./firestore-institution-mapper";

type RankedSearchHit = {
  readonly document: InstitutionSearchDocument;
  readonly score: number;
};

/**
 * Executes Firestore-fallback keyword search over institution documents.
 * Published-only; applies InstitutionFilters; basic relevance / name ordering.
 */
export function searchInstitutionsInStore(
  records: readonly { id: string; data: FirestoreInstitutionDocument }[],
  query: InstitutionSearchQuery,
): InstitutionSearchResult {
  const text = query.text.trim();
  const filters = query.filters;

  const hits: RankedSearchHit[] = [];

  for (const record of records) {
    if (record.data.lifecycleStatus !== InstitutionStatus.Published) {
      continue;
    }

    const institution = FirestoreInstitutionMapper.toDomain(record.id, record.data);
    const searchDoc = toSearchDocument(institution, record.data);

    if (filters.cityId && !geoIdsMatch(filters.cityId, searchDoc.cityId, "city")) {
      continue;
    }
    if (filters.districtId && !geoIdsMatch(filters.districtId, searchDoc.districtId, "district")) {
      continue;
    }
    if (filters.primaryType && searchDoc.primaryType !== filters.primaryType) {
      continue;
    }
    if (filters.verification && searchDoc.verification !== filters.verification) {
      continue;
    }
    if (filters.isPremium !== undefined && searchDoc.isPremium !== filters.isPremium) {
      continue;
    }
    if (filters.status && institution.status !== filters.status) {
      continue;
    }

    const score = text
      ? scoreInstitutionNameSearch(
          text,
          {
            name: searchDoc.name,
            nameFolded: searchDoc.nameFolded,
            searchKeywords: searchDoc.searchKeywords,
            qualityScore: searchDoc.qualityScore,
            verification: searchDoc.verification,
            isPremium: searchDoc.isPremium,
          },
          { cityId: filters.cityId, districtId: filters.districtId },
        )
      : searchDoc.qualityScore;

    if (text && score <= 0) {
      continue;
    }

    hits.push({ document: searchDoc, score: text ? score : searchDoc.qualityScore });
  }

  hits.sort((left, right) => compareHits(left, right, query.sort));

  const totalItems = hits.length;
  const start = (query.page - 1) * query.pageSize;
  const items = hits.slice(start, start + query.pageSize).map((hit) => hit.document);

  return createInstitutionSearchResult({
    query,
    items,
    totalItems,
  });
}

/**
 * Matches catalog ids (`istanbul`) with legacy seed ids (`city_istanbul` / `dist_…`).
 */
function geoIdsMatch(
  filterId: string,
  documentId: string,
  kind: "city" | "district",
): boolean {
  if (filterId === documentId) {
    return true;
  }
  const prefix = kind === "city" ? /^city_/i : /^dist_/i;
  const normalize = (value: string) =>
    value.replace(prefix, "").replaceAll("_", "-").toLowerCase();
  return normalize(filterId) === normalize(documentId);
}

/**
 * Maps store records to search projection documents (no filtering/pagination).
 */
export function toSearchDocumentsFromRecords(
  records: readonly { id: string; data: FirestoreInstitutionDocument }[],
): InstitutionSearchDocument[] {
  return records.map((record) => {
    const institution = FirestoreInstitutionMapper.toDomain(record.id, record.data);
    return toSearchDocument(institution, record.data);
  });
}

function toSearchDocument(
  institution: Institution,
  data: FirestoreInstitutionDocument,
): InstitutionSearchDocument {
  const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);
  const cityName = data.cityName?.trim() || geo.cityName;
  const districtName = data.districtName?.trim() || geo.districtName;

  return createPublishedSearchDocument({
    id: institutionIdAsString(institution.id),
    slug: institution.slug,
    name: institution.name,
    primaryType: institution.primaryType,
    cityId: institution.location.cityId,
    citySlug: geo.citySlug,
    cityName,
    districtId: institution.location.districtId,
    districtSlug: geo.districtSlug,
    districtName,
    verification: institution.verification,
    isPremium: institution.isPremium,
    qualityScore: institution.qualityScore,
    searchKeywords: data.searchKeywords?.length
      ? data.searchKeywords
      : tokenizeInstitutionSearchKeywords(institution.name),
    geohash: institution.location.geohash,
    coverImageUrl: institution.coverImageUrl ?? data.coverImageUrl,
    updatedAt: institution.updatedAt,
    nameFolded: data.nameFolded || foldTurkishText(institution.name),
  });
}

function compareHits(left: RankedSearchHit, right: RankedSearchHit, sort: InstitutionSort): number {
  if (sort === InstitutionSort.NameAsc) {
    const byName = left.document.name.localeCompare(right.document.name, "tr");
    if (byName !== 0) return byName;
    return left.document.id.localeCompare(right.document.id);
  }

  if (sort === InstitutionSort.NameDesc) {
    const byName = right.document.name.localeCompare(left.document.name, "tr");
    if (byName !== 0) return byName;
    return left.document.id.localeCompare(right.document.id);
  }

  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (right.document.qualityScore !== left.document.qualityScore) {
    return right.document.qualityScore - left.document.qualityScore;
  }

  const byName = left.document.name.localeCompare(right.document.name, "tr");
  if (byName !== 0) return byName;
  return left.document.id.localeCompare(right.document.id);
}
