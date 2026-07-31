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
 * Cursor is an offset-based token for now (0-based index).
 * It enables infinite-scroll clients without changing current page-number UI.
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
  const offset = cursorRaw ? Number.parseInt(cursorRaw, 10) : 0;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

  // Current implementation: cursor maps to page number, keeping existing backend search semantics.
  const page = Math.floor(safeOffset / pageSize) + 1;

  const filterOptions = getSearchFilterOptions({
    query: q,
    sort,
    cityId: firstParam(searchParams.get("city")),
    districtId: firstParam(searchParams.get("district")),
    type: firstParam(searchParams.get("type")),
    verified: firstParam(searchParams.get("verified")),
    premium: firstParam(searchParams.get("premium")),
  });

  const view = await searchPublicInstitutions({
    text: q,
    page,
    pageSize,
    sort,
    filters: toSearchFiltersInput(filterOptions.active),
  });

  const totalItems = view.result.page.totalItems;
  const institutions = view.institutions;
  const returnedCount = institutions.length;
  const nextOffset = safeOffset + returnedCount;
  const nextCursor = nextOffset < totalItems ? String(nextOffset) : null;

  const response: SearchInstitutionsCursorResponse = Object.freeze({
    query: q,
    institutions,
    totalItems,
    pageSize,
    currentCursor: cursorRaw ? cursorRaw : null,
    nextCursor,
  });

  return NextResponse.json(response);
}

