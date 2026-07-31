import { NextResponse } from "next/server";
import { getHomeFeaturedInstitutionsView } from "@/server/institutions/get-home-featured-institutions";
import { assertFirestoreReadsBudget, runWithFirestoreCounters } from "@eduatlas/firebase/monitoring";

export const dynamic = "force-dynamic";

/**
 * Homepage Keşfet featured institutions by optional city + profile completeness.
 * GET /api/home/featured?cityId=istanbul
 */
export async function GET(request: Request) {
  return runWithFirestoreCounters(async () => {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId")?.trim() || null;

    const view = await getHomeFeaturedInstitutionsView({ cityId });
    assertFirestoreReadsBudget("home");

    return NextResponse.json({
      cityId: view.cityId,
      institutions: view.institutions,
    });
  });
}
