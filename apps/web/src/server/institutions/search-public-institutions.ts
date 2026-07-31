import {
  createInstitutionSearchQuery,
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

/**
 * Runs public keyword search through InstitutionSearchRepository only.
 * Never throws not-found — empty result sets are valid.
 * Falls back to an empty local store when Firestore is unavailable/over quota
 * (dummy seeds are not re-injected).
 */
export async function searchPublicInstitutions(options: {
  text?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  filters?: CreateInstitutionFiltersInput;
  repository?: InstitutionSearchRepository;
}): Promise<PublicInstitutionSearchView> {
  const text = options.text?.trim() ?? "";
  const searchQuery = createInstitutionSearchQuery({
    text,
    sort: resolveSort(options.sort),
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 12,
    filters: options.filters ?? {},
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
  };
}
