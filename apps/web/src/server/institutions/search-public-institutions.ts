import {
  createInstitutionSearchQuery,
  createInstitutionSearchResult,
  type CreateInstitutionFiltersInput,
  type InstitutionSearchRepository,
  type InstitutionSearchResult,
  InstitutionSort,
  parseInstitutionSort,
} from "@eduatlas/application";
import { createEmptyInstitutionRepository } from "@eduatlas/firebase/server";
import type { InstitutionCardViewData } from "@eduatlas/ui";
import { getInstitutionSearchRepository } from "./repository";
import { toInstitutionCardFromSearchDocument } from "./to-search-card";

export type PublicInstitutionSearchView = {
  readonly query: string;
  readonly result: InstitutionSearchResult;
  readonly institutions: readonly InstitutionCardViewData[];
  /** Firestore startAfter cursor for empty-text / structured search pages. */
  readonly nextCursor: string | null;
  /**
   * True when free-text was requested without cityId.
   * Public search must not run nationwide listAll() — UI shows location gate.
   */
  readonly locationRequired: boolean;
};

function isQuotaOrUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "8" ||
    /RESOURCE_EXHAUSTED|Quota exceeded|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(`${code} ${message}`)
  );
}

function resolveSort(raw: string | undefined): InstitutionSort {
  try {
    return parseInstitutionSort(raw);
  } catch {
    return InstitutionSort.Relevance;
  }
}

function buildLocationRequiredView(options: {
  text: string;
  page: number;
  pageSize: number;
  sort: InstitutionSort;
  filters: CreateInstitutionFiltersInput;
  cursor?: string | null;
}): PublicInstitutionSearchView {
  const searchQuery = createInstitutionSearchQuery({
    text: options.text,
    sort: options.sort,
    page: options.page,
    pageSize: options.pageSize,
    filters: options.filters,
    cursor: options.cursor,
  });

  return {
    query: options.text,
    result: createInstitutionSearchResult({
      query: searchQuery,
      items: [],
      totalItems: 0,
    }),
    institutions: [],
    nextCursor: null,
    locationRequired: true,
  };
}

/**
 * Runs public keyword search through InstitutionSearchRepository only.
 * Never throws not-found — empty result sets are valid.
 * Falls back to an empty local store when Firestore is unavailable/over quota
 * (dummy seeds are not re-injected).
 *
 * Empty-text / structured filters use a bounded Firestore path.
 * Free-text requires cityId — unscoped free-text never calls repository.search / listAll.
 */
export async function searchPublicInstitutions(options: {
  text?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  cursor?: string | null;
  filters?: CreateInstitutionFiltersInput;
  repository?: InstitutionSearchRepository;
}): Promise<PublicInstitutionSearchView> {
  const text = options.text?.trim() ?? "";
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 12;
  const sort = resolveSort(options.sort);
  const filters = options.filters ?? {};
  const cityId = filters.cityId?.trim();

  // Public free-text MUST be city-scoped — never nationwide listAll().
  if (text && !cityId) {
    return buildLocationRequiredView({
      text,
      page,
      pageSize,
      sort,
      filters,
      cursor: options.cursor,
    });
  }

  // Empty browse without city/district/type is also gated — no nationwide "tüm kurumlar".
  const hasBrowseScope = Boolean(
    cityId || filters.districtId?.trim() || filters.primaryType,
  );
  if (!text && !hasBrowseScope) {
    return buildLocationRequiredView({
      text: "",
      page,
      pageSize,
      sort,
      filters,
      cursor: options.cursor,
    });
  }

  const searchQuery = createInstitutionSearchQuery({
    text,
    sort,
    page,
    pageSize,
    filters,
    cursor: options.cursor,
  });

  const primary = options.repository ?? (await getInstitutionSearchRepository());

  let result: InstitutionSearchResult;
  try {
    result = await primary.search(searchQuery);
  } catch (error) {
    if (!isQuotaOrUnavailableError(error)) {
      throw error;
    }
    console.warn(
      "[eduatlas] Institution search fell back to empty local store after backend failure:",
      error instanceof Error ? error.message : error,
    );
    const fallback = await createEmptyInstitutionRepository();
    result = await fallback.search(searchQuery);
  }

  const institutions = result.page.items.map(toInstitutionCardFromSearchDocument);

  return {
    query: text,
    result,
    institutions,
    nextCursor: result.nextCursor ?? null,
    locationRequired: false,
  };
}
