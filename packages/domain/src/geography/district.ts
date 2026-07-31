import { type CityId, cityIdAsString, createCityId } from "./city-id";
import { createDistrictId, type DistrictId, districtIdAsString } from "./district-id";
import { GeoLifecycleStatus, parseGeoLifecycleStatus } from "./geo-lifecycle-status";
import {
  assertValidGeographySlug,
  normalizeGeographySlug,
  slugifyGeographyName,
} from "./geography-slug";

/**
 * Canonical District (ilçe) aggregate; belongs to a City.
 */
export type District = Readonly<{
  readonly id: DistrictId;
  readonly cityId: CityId;
  readonly nameTr: string;
  readonly slug: string;
  readonly lifecycleStatus: GeoLifecycleStatus;
  readonly nameEn?: string;
  readonly seoIntroHtml?: string;
  readonly sortOrder: number;
  /** Placeholder until institutions attach to geography. */
  readonly statistics: DistrictStatisticsPlaceholder;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type DistrictStatisticsPlaceholder = Readonly<{
  readonly institutionCount: number;
  readonly publishedInstitutionCount: number;
  readonly claimedInstitutionCount: number;
}>;

export type CreateDistrictInput = {
  id?: string;
  cityId: string;
  nameTr: string;
  /** Local slug within city; full document id uses citySlug-localSlug when id omitted. */
  slug?: string;
  citySlug?: string;
  lifecycleStatus?: GeoLifecycleStatus | string;
  nameEn?: string;
  seoIntroHtml?: string;
  sortOrder?: number;
  institutionCount?: number;
  publishedInstitutionCount?: number;
  claimedInstitutionCount?: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Creates an immutable District entity.
 */
export function createDistrict(input: CreateDistrictInput): District {
  const nameTr = input.nameTr.trim();
  const cityId = createCityId(input.cityId);
  const localSlug = normalizeGeographySlug(input.slug ?? slugifyGeographyName(nameTr));
  const citySlug = normalizeGeographySlug(input.citySlug ?? cityIdAsString(cityId));
  const globalSlug = `${citySlug}-${localSlug}`;
  const id = createDistrictId(input.id ?? globalSlug);
  const lifecycleStatus = input.lifecycleStatus
    ? typeof input.lifecycleStatus === "string"
      ? parseGeoLifecycleStatus(input.lifecycleStatus)
      : input.lifecycleStatus
    : GeoLifecycleStatus.Published;
  const nameEn = input.nameEn?.trim();
  const seoIntroHtml = input.seoIntroHtml?.trim();
  const institutionCount = input.institutionCount ?? 0;
  const publishedInstitutionCount = input.publishedInstitutionCount ?? 0;
  const claimedInstitutionCount = input.claimedInstitutionCount ?? 0;

  if (!nameTr) {
    throw new Error("District.nameTr is required.");
  }
  assertValidGeographySlug(localSlug, "District.slug");
  assertValidGeographySlug(globalSlug, "District.id");
  assertIsoTimestamp(input.createdAt, "createdAt");
  assertIsoTimestamp(input.updatedAt, "updatedAt");
  assertNonNegative(institutionCount, "institutionCount");
  assertNonNegative(publishedInstitutionCount, "publishedInstitutionCount");
  assertNonNegative(claimedInstitutionCount, "claimedInstitutionCount");

  return Object.freeze({
    id,
    cityId,
    nameTr,
    slug: localSlug,
    lifecycleStatus,
    ...(nameEn ? { nameEn } : {}),
    ...(seoIntroHtml ? { seoIntroHtml } : {}),
    sortOrder: input.sortOrder ?? 0,
    statistics: Object.freeze({
      institutionCount,
      publishedInstitutionCount,
      claimedInstitutionCount,
    }),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

export function districtAsStringId(district: District): string {
  return districtIdAsString(district.id);
}

function assertIsoTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`District.${field} must be an ISO timestamp.`);
  }
}

function assertNonNegative(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`District.${field} must be a non-negative integer.`);
  }
}
