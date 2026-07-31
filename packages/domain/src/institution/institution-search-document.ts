import type { Institution } from "./institution";
import { institutionIdAsString } from "./institution-id";
import { InstitutionStatus, isPubliclyVisibleStatus } from "./institution-status";
import { getInstitutionTypeSlug, type InstitutionType } from "./institution-type";
import type { InstitutionVerification } from "./institution-verification";
import { foldTurkishText, tokenizeSearchKeywords } from "./validation";

/**
 * Public search index projection (SEARCH-ARCHITECTURE / FIREBASE institutions_public).
 * Never includes lead PII, claim documents, or unpublished drafts.
 */
export type InstitutionSearchDocument = Readonly<{
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly nameFolded: string;
  readonly primaryType: InstitutionType;
  readonly typeSlug: string;
  readonly cityId: string;
  readonly citySlug: string;
  readonly cityName: string;
  readonly districtId: string;
  readonly districtSlug: string;
  readonly districtName: string;
  readonly status: InstitutionStatus;
  readonly verification: InstitutionVerification;
  readonly isPremium: boolean;
  readonly isFeatured: boolean;
  readonly qualityScore: number;
  readonly searchKeywords: readonly string[];
  readonly geohash?: string;
  /** Public cover / hero image when the institution uploaded one. */
  readonly coverImageUrl?: string;
  readonly updatedAt: string;
}>;

export type CreateInstitutionSearchDocumentInput = {
  id: string;
  slug: string;
  name: string;
  primaryType: InstitutionType;
  cityId: string;
  citySlug: string;
  cityName: string;
  districtId: string;
  districtSlug: string;
  districtName: string;
  status: InstitutionStatus;
  verification: InstitutionVerification;
  isPremium?: boolean;
  isFeatured?: boolean;
  qualityScore?: number;
  searchKeywords?: readonly string[];
  geohash?: string;
  coverImageUrl?: string;
  updatedAt: string;
  nameFolded?: string;
};

export type InstitutionSearchGeoLabels = {
  citySlug: string;
  cityName: string;
  districtSlug: string;
  districtName: string;
};

/**
 * Creates an immutable search projection document.
 */
export function createInstitutionSearchDocument(
  input: CreateInstitutionSearchDocumentInput,
): InstitutionSearchDocument {
  if (!isPubliclyVisibleStatus(input.status)) {
    throw new Error("InstitutionSearchDocument requires published status.");
  }

  const name = input.name.trim();
  const slug = input.slug.trim();
  const nameFolded = (input.nameFolded ?? foldTurkishText(name)).trim();
  const searchKeywords = Object.freeze(
    (input.searchKeywords ?? tokenizeSearchKeywords(name))
      .map((token) => token.trim())
      .filter(Boolean),
  );

  if (!name || !slug || !nameFolded) {
    throw new Error("InstitutionSearchDocument requires name, slug, and nameFolded.");
  }

  return Object.freeze({
    id: input.id.trim(),
    slug,
    name,
    nameFolded,
    primaryType: input.primaryType,
    typeSlug: getInstitutionTypeSlug(input.primaryType),
    cityId: input.cityId.trim(),
    citySlug: input.citySlug.trim(),
    cityName: input.cityName.trim(),
    districtId: input.districtId.trim(),
    districtSlug: input.districtSlug.trim(),
    districtName: input.districtName.trim(),
    status: InstitutionStatus.Published,
    verification: input.verification,
    isPremium: Boolean(input.isPremium),
    isFeatured: Boolean(input.isFeatured),
    qualityScore: input.qualityScore ?? 0,
    searchKeywords,
    ...(input.geohash?.trim() ? { geohash: input.geohash.trim() } : {}),
    ...(input.coverImageUrl?.trim() ? { coverImageUrl: input.coverImageUrl.trim() } : {}),
    updatedAt: input.updatedAt,
  });
}

/**
 * Projects a published Institution into a search document.
 */
export function toInstitutionSearchDocument(
  institution: Institution,
  geo: InstitutionSearchGeoLabels,
  options?: {
    isFeatured?: boolean;
    searchKeywords?: readonly string[];
  },
): InstitutionSearchDocument {
  return createInstitutionSearchDocument({
    id: institutionIdAsString(institution.id),
    slug: institution.slug,
    name: institution.name,
    primaryType: institution.primaryType,
    cityId: institution.location.cityId,
    citySlug: geo.citySlug,
    cityName: geo.cityName,
    districtId: institution.location.districtId,
    districtSlug: geo.districtSlug,
    districtName: geo.districtName,
    status: institution.status,
    verification: institution.verification,
    isPremium: institution.isPremium,
    isFeatured: options?.isFeatured,
    qualityScore: institution.qualityScore,
    searchKeywords: options?.searchKeywords,
    geohash: institution.location.geohash,
    coverImageUrl: institution.coverImageUrl,
    updatedAt: institution.updatedAt,
  });
}
