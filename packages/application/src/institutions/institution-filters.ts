import type { InstitutionStatus, InstitutionType, InstitutionVerification } from "@eduatlas/domain";

/**
 * Framework-agnostic filters for institution list / browse queries.
 */
export type InstitutionFilters = Readonly<{
  readonly cityId?: string;
  readonly districtId?: string;
  readonly primaryType?: InstitutionType;
  readonly status?: InstitutionStatus;
  readonly verification?: InstitutionVerification;
  readonly isPremium?: boolean;
  readonly query?: string;
}>;

export type CreateInstitutionFiltersInput = {
  cityId?: string;
  districtId?: string;
  primaryType?: InstitutionType;
  status?: InstitutionStatus;
  verification?: InstitutionVerification;
  isPremium?: boolean;
  query?: string;
};

/**
 * Creates an immutable InstitutionFilters value.
 */
export function createInstitutionFilters(
  input: CreateInstitutionFiltersInput = {},
): InstitutionFilters {
  const cityId = input.cityId?.trim();
  const districtId = input.districtId?.trim();
  const query = input.query?.trim();

  if (districtId && !cityId) {
    throw new Error("InstitutionFilters.districtId requires cityId.");
  }

  return Object.freeze({
    ...(cityId ? { cityId } : {}),
    ...(districtId ? { districtId } : {}),
    ...(input.primaryType ? { primaryType: input.primaryType } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.verification ? { verification: input.verification } : {}),
    ...(input.isPremium !== undefined ? { isPremium: input.isPremium } : {}),
    ...(query ? { query } : {}),
  });
}
