import type { InstitutionSearchQuery, InstitutionSearchResult } from "@eduatlas/application";
import { createInstitutionSearchResult, InstitutionSort } from "@eduatlas/application";
import {
  createPublishedSearchDocument,
  foldTurkishText,
  type Institution,
  type InstitutionSearchDocument,
  InstitutionStatus,
  institutionIdAsString,
  isInstitutionVerified,
  tokenizeSearchKeywords,
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
  const foldedQuery = foldTurkishText(text);
  const queryTokens = foldedQuery ? tokenizeSearchKeywords(foldedQuery) : [];
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

    const score = scoreSearchHit(searchDoc, foldedQuery, queryTokens);

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
      : tokenizeSearchKeywords(`${institution.name} ${cityName} ${districtName}`),
    geohash: institution.location.geohash,
    coverImageUrl: institution.coverImageUrl ?? data.coverImageUrl,
    updatedAt: institution.updatedAt,
    nameFolded: data.nameFolded || foldTurkishText(institution.name),
  });
}

function scoreSearchHit(
  document: InstitutionSearchDocument,
  foldedQuery: string,
  queryTokens: readonly string[],
): number {
  if (!foldedQuery) {
    return document.qualityScore;
  }

  let score = 0;
  const nameFolded = document.nameFolded;

  if (nameFolded === foldedQuery) {
    score += 1000;
  } else if (nameFolded.startsWith(foldedQuery)) {
    score += 800;
  } else if (nameFolded.includes(foldedQuery)) {
    score += 600;
  }

  const keywords = document.searchKeywords.map((token) => foldTurkishText(token));
  for (const token of queryTokens) {
    if (keywords.includes(token)) {
      score += 400;
    } else if (keywords.some((keyword) => keyword.includes(token) || token.includes(keyword))) {
      score += 200;
    } else if (nameFolded.includes(token)) {
      score += 150;
    }
  }

  if (score > 0) {
    score += document.qualityScore;
    if (isInstitutionVerified(document.verification)) {
      score += 10;
    }
    if (document.isPremium) {
      score += 5;
    }
  }

  return score;
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

  return left.document.id.localeCompare(right.document.id);
}
