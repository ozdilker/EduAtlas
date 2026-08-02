import type { InstitutionType } from "../institution/institution-type";
import {
  type InstitutionVerification,
  isInstitutionVerification,
  parseInstitutionVerification,
} from "../institution/institution-verification";

export type CampaignSegmentFilters = Readonly<{
  readonly cityId?: string;
  readonly districtId?: string;
  readonly primaryType?: InstitutionType | string;
  readonly verification?: InstitutionVerification | string;
  readonly isPremium?: boolean;
  readonly hasEmail?: boolean;
  readonly hasWebsite?: boolean;
  readonly hasPhone?: boolean;
  readonly googleRatingMin?: number;
  readonly googleRatingMax?: number;
}>;

export type CampaignSegment = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly filters: CampaignSegmentFilters;
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type CreateCampaignSegmentInput = {
  id: string;
  name: string;
  description?: string;
  filters?: CampaignSegmentFilters;
  createdAt: string;
  updatedAt: string;
};

/**
 * Creates an immutable campaign audience segment (dynamic filters).
 */
export function createCampaignSegment(input: CreateCampaignSegmentInput): CampaignSegment {
  const id = input.id.trim();
  const name = input.name.trim();
  const description = input.description?.trim();
  if (!id) throw new Error("CampaignSegment.id is required.");
  if (!name) throw new Error("CampaignSegment.name is required.");
  assertIso(input.createdAt, "createdAt");
  assertIso(input.updatedAt, "updatedAt");

  return Object.freeze({
    id,
    name,
    ...(description ? { description } : {}),
    filters: normalizeFilters(input.filters ?? {}),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

function normalizeFilters(filters: CampaignSegmentFilters): CampaignSegmentFilters {
  const cityId = filters.cityId?.trim();
  const districtId = filters.districtId?.trim();
  const primaryType =
    typeof filters.primaryType === "string" ? filters.primaryType.trim() : filters.primaryType;
  let verification = filters.verification;
  if (typeof verification === "string") {
    verification = parseInstitutionVerification(verification);
  } else if (verification !== undefined && !isInstitutionVerification(verification)) {
    throw new Error("CampaignSegment.filters.verification is invalid.");
  }
  if (filters.googleRatingMin !== undefined && (filters.googleRatingMin < 0 || filters.googleRatingMin > 5)) {
    throw new Error("CampaignSegment.filters.googleRatingMin must be 0–5.");
  }
  if (filters.googleRatingMax !== undefined && (filters.googleRatingMax < 0 || filters.googleRatingMax > 5)) {
    throw new Error("CampaignSegment.filters.googleRatingMax must be 0–5.");
  }

  return Object.freeze({
    ...(cityId ? { cityId } : {}),
    ...(districtId ? { districtId } : {}),
    ...(primaryType ? { primaryType } : {}),
    ...(verification ? { verification } : {}),
    ...(filters.isPremium !== undefined ? { isPremium: filters.isPremium } : {}),
    ...(filters.hasEmail !== undefined ? { hasEmail: filters.hasEmail } : {}),
    ...(filters.hasWebsite !== undefined ? { hasWebsite: filters.hasWebsite } : {}),
    ...(filters.hasPhone !== undefined ? { hasPhone: filters.hasPhone } : {}),
    ...(filters.googleRatingMin !== undefined ? { googleRatingMin: filters.googleRatingMin } : {}),
    ...(filters.googleRatingMax !== undefined ? { googleRatingMax: filters.googleRatingMax } : {}),
  });
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`CampaignSegment.${field} must be a valid ISO timestamp.`);
  }
}
