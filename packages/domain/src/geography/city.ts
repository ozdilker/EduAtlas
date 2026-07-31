import { type CityId, cityIdAsString, createCityId } from "./city-id";
import { GeoLifecycleStatus, parseGeoLifecycleStatus } from "./geo-lifecycle-status";
import {
  assertValidGeographySlug,
  normalizeGeographySlug,
  slugifyGeographyName,
} from "./geography-slug";

/**
 * Canonical City (Türkiye ili) aggregate for geography catalog.
 */
export type City = Readonly<{
  readonly id: CityId;
  readonly nameTr: string;
  readonly slug: string;
  readonly plateCode: string;
  readonly lifecycleStatus: GeoLifecycleStatus;
  readonly nameEn?: string;
  readonly sortOrder: number;
  readonly isPriority: boolean;
  readonly seoIntroHtml?: string;
  /** Placeholder until institutions attach to geography. */
  readonly statistics: CityStatisticsPlaceholder;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

/**
 * Soft stats reserved for institution coverage; zero until supply is linked.
 */
export type CityStatisticsPlaceholder = Readonly<{
  readonly institutionCount: number;
  readonly publishedInstitutionCount: number;
  readonly claimedInstitutionCount: number;
  readonly districtCount: number;
}>;

export type CreateCityInput = {
  id?: string;
  nameTr: string;
  slug?: string;
  plateCode: string;
  lifecycleStatus?: GeoLifecycleStatus | string;
  nameEn?: string;
  sortOrder?: number;
  isPriority?: boolean;
  seoIntroHtml?: string;
  districtCount?: number;
  institutionCount?: number;
  publishedInstitutionCount?: number;
  claimedInstitutionCount?: number;
  createdAt: string;
  updatedAt: string;
};

const PLATE_CODE_PATTERN = /^(0[1-9]|[1-7][0-9]|8[01])$/;

/**
 * Creates an immutable City entity.
 */
export function createCity(input: CreateCityInput): City {
  const nameTr = input.nameTr.trim();
  const plateCode = input.plateCode.trim().padStart(2, "0");
  const slug = normalizeGeographySlug(input.slug ?? slugifyGeographyName(nameTr));
  const id = createCityId(input.id ?? slug);
  const lifecycleStatus = input.lifecycleStatus
    ? typeof input.lifecycleStatus === "string"
      ? parseGeoLifecycleStatus(input.lifecycleStatus)
      : input.lifecycleStatus
    : GeoLifecycleStatus.Published;
  const nameEn = input.nameEn?.trim();
  const seoIntroHtml = input.seoIntroHtml?.trim();
  const sortOrder = input.sortOrder ?? Number.parseInt(plateCode, 10);
  const districtCount = input.districtCount ?? 0;
  const institutionCount = input.institutionCount ?? 0;
  const publishedInstitutionCount = input.publishedInstitutionCount ?? 0;
  const claimedInstitutionCount = input.claimedInstitutionCount ?? 0;

  if (!nameTr) {
    throw new Error("City.nameTr is required.");
  }
  if (!PLATE_CODE_PATTERN.test(plateCode)) {
    throw new Error("City.plateCode must be 01–81.");
  }
  assertValidGeographySlug(slug, "City.slug");
  assertIsoTimestamp(input.createdAt, "createdAt");
  assertIsoTimestamp(input.updatedAt, "updatedAt");
  assertNonNegative(districtCount, "districtCount");
  assertNonNegative(institutionCount, "institutionCount");
  assertNonNegative(publishedInstitutionCount, "publishedInstitutionCount");
  assertNonNegative(claimedInstitutionCount, "claimedInstitutionCount");

  return Object.freeze({
    id,
    nameTr,
    slug,
    plateCode,
    lifecycleStatus,
    ...(nameEn ? { nameEn } : {}),
    sortOrder,
    isPriority: input.isPriority ?? false,
    ...(seoIntroHtml ? { seoIntroHtml } : {}),
    statistics: Object.freeze({
      institutionCount,
      publishedInstitutionCount,
      claimedInstitutionCount,
      districtCount,
    }),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

export function cityAsStringId(city: City): string {
  return cityIdAsString(city.id);
}

function assertIsoTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`City.${field} must be an ISO timestamp.`);
  }
}

function assertNonNegative(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`City.${field} must be a non-negative integer.`);
  }
}
