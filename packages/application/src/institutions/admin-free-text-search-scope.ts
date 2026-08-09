import type { InstitutionType } from "@eduatlas/domain";

/**
 * Admin free-text (`q`) may only run against a structured candidate scope.
 * Nationwide unscoped q must never call listAll() / full-catalog loads.
 */
export const ADMIN_FREE_TEXT_SEARCH_LOCATION_REQUIRED_MESSAGE =
  "Serbest metin araması için şehir, ilçe veya kurum türü seçin.";

export type AdminFreeTextSearchScopeInput = Readonly<{
  readonly cityId?: string | null;
  readonly districtId?: string | null;
  readonly primaryType?: InstitutionType | string | null;
}>;

/**
 * True when free-text search has city, district, or primary type scope.
 */
export function hasAdminFreeTextSearchScope(input: AdminFreeTextSearchScopeInput): boolean {
  return Boolean(input.cityId?.trim() || input.districtId?.trim() || input.primaryType);
}

/**
 * True when a free-text query is present without geographic/type scope.
 */
export function isUnscopedAdminFreeTextQuery(
  query: string | null | undefined,
  scope: AdminFreeTextSearchScopeInput,
): boolean {
  return Boolean(query?.trim()) && !hasAdminFreeTextSearchScope(scope);
}
