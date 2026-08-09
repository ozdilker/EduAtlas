export type AdminPublishedFilterOption = Readonly<{
  readonly id: string;
  readonly label: string;
}>;

export type AdminPublishedInstitutionRow = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly typeLabel: string;
  readonly cityId: string;
  readonly cityLabel: string;
  readonly districtId: string;
  readonly districtLabel: string;
  readonly statusLabel: string;
  readonly qualityScore: number;
  readonly publishedAtLabel: string;
  readonly publicHref: string;
  readonly profileHref: string;
}>;

export type AdminPublishedPagination = Readonly<{
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly from: number;
  readonly to: number;
  readonly pageNumbers: readonly number[];
  /** Firestore startAfter cursor for the next page (null when none). */
  readonly nextCursor: string | null;
  /** Cursor used to load this page (null on first page). */
  readonly cursor: string | null;
  readonly hasNextPage: boolean;
}>;

export type AdminPublishedInstitutionsViewData = Readonly<{
  readonly title: string;
  readonly subtitle: string;
  readonly totalCount: number;
  readonly filteredCount: number;
  readonly query: string;
  readonly cityId: string;
  readonly cities: readonly AdminPublishedFilterOption[];
  readonly rows: readonly AdminPublishedInstitutionRow[];
  readonly emptyMessage: string;
  readonly pagination: AdminPublishedPagination;
  /**
   * When true, free-text search used the legacy full-scan path (substring correctness).
   * Normal listing never sets this.
   */
  readonly usedLegacySearchScan?: boolean;
  /** True when `q` was present without city scope — no catalog load. */
  readonly locationRequired?: boolean;
}>;

export const ADMIN_PUBLISHED_PAGE_SIZE = 50;

export function buildAdminPublishedHref(input: {
  cityId?: string;
  q?: string;
  page?: number;
  cursor?: string | null;
}): string {
  const params = new URLSearchParams();
  if (input.cityId?.trim()) {
    params.set("cityId", input.cityId.trim());
  }
  if (input.q?.trim()) {
    params.set("q", input.q.trim());
  }
  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }
  const cursor = input.cursor?.trim();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const qs = params.toString();
  return qs ? `/admin/published?${qs}` : "/admin/published";
}

/**
 * Builds a compact page-number window around the current page.
 * With Firestore cursors, only page 1 and current+1 (when nextCursor exists) are linkable.
 */
export function buildAdminPublishedPageNumbers(
  page: number,
  totalPages: number,
  windowSize = 5,
): readonly number[] {
  if (totalPages <= 1) {
    return Object.freeze([1]);
  }
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  return Object.freeze(Array.from({ length: end - start + 1 }, (_, index) => start + index));
}
