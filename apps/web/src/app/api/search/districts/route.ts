import { NextResponse } from "next/server";
import { getDistrictOptionsForCity } from "@/server/search/search-filter-options";

export const dynamic = "force-dynamic";

/**
 * Async district options for the public search filter sidebar.
 * GET /api/search/districts?city=istanbul
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() ?? "";

  if (!city) {
    return NextResponse.json({ cityId: null, districts: [] });
  }

  const districts = getDistrictOptionsForCity(city);
  return NextResponse.json({
    cityId: city,
    districts,
  });
}
