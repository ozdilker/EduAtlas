import { NextResponse } from "next/server";
import type { InstitutionCardViewData } from "@eduatlas/ui";
import {
  getSearchFilterOptions,
  toSearchFiltersInput,
} from "@/server/search/search-filter-options";
import { searchPublicInstitutions } from "@/server/institutions/search-public-institutions";

export const dynamic = "force-dynamic";

type SearchInstitutionsCursorResponse = Readonly<{
  query: string;
  institutions: readonly InstitutionCardViewData[];
  totalItems: number;
  pageSize: number;
  currentCursor: string | null;
  nextCursor: string | null;
  /** Free-text without city — client should show location gate; no catalog scan. */
  locationRequired: boolean;
}>;

function firstParam(value: string | string[] | null): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

/**
 * Cursor-based (infinite scroll) search endpoint.
 *
 * - Empty-text / structured filters: opaque Firestore startAfter cursor (published-browse format).
 * - Free-text: requires city; unscoped q returns locationRequired (no listAll).
 *
 * GET /api/search/institutions-cursor?q=...&cursor=...&pageSize=12&city=...&district=...&type=...&verified=...&premium=...&sort=relevance
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = firstParam(searchParams.get("q")).trim();
  const sort = firstParam(searchParams.get("sort")).trim() || "relevance";

  const pageSizeRaw = Number.parseInt(firstParam(searchParams.get("pageSize")), 10);
  const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 12;

  const cursorRaw = searchParams.get("cursor")?.trim() ?? "";

  const filterOptions = getSearchFilterOptions({
    query: q,
    sort,
    cityId: firstParam(searchParams.get("city")),
    districtId: firstParam(searchParams.get("district")),
    type: firstParam(searchParams.get("type")),
    verified: firstParam(searchParams.get("verified")),
    premium: firstParam(searchParams.get("premium")),
  });

  let page = 1;
  let cursor: string | undefined;

  if (!q) {
    cursor = cursorRaw || undefined;
    page = cursor ? 2 : 1;
  } else {
    const offset = cursorRaw ? Number.parseInt(cursorRaw, 10) : 0;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
    page = Math.floor(safeOffset / pageSize) + 1;
  }

  const view = await searchPublicInstitutions({
    text: q,
    page,
    pageSize,
    sort,
    cursor,
    filters: toSearchFiltersInput(filterOptions.active),
  });

  if (view.locationRequired) {
    const blocked: SearchInstitutionsCursorResponse = Object.freeze({
      query: q,
      institutions: [],
      totalItems: 0,
      pageSize,
      currentCursor: null,
      nextCursor: null,
      locationRequired: true,
    });
    return NextResponse.json(blocked);
  }

  const totalItems = view.result.page.totalItems;
  const institutions = view.institutions;

  let nextCursor: string | null;
  if (!q) {
    nextCursor = view.nextCursor;
  } else {
    const offset = cursorRaw ? Number.parseInt(cursorRaw, 10) : 0;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
    const nextOffset = safeOffset + institutions.length;
    nextCursor = nextOffset < totalItems ? String(nextOffset) : null;
  }

  const response: SearchInstitutionsCursorResponse = Object.freeze({
    query: q,
    institutions,
    totalItems,
    pageSize,
    currentCursor: cursorRaw ? cursorRaw : null,
    nextCursor,
    locationRequired: false,
  });

  return NextResponse.json(response);
}
