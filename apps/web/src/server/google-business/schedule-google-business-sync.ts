import {
  isGoogleSyncEligibleRequest,
  syncGoogleBusiness,
} from "@eduatlas/application";
import { decideGoogleBusinessSync, institutionIdAsString, type Institution } from "@eduatlas/domain";
import { resolveGeoLabels } from "@eduatlas/firebase/server";
import { createGooglePlacesProviderFromEnv } from "@eduatlas/firebase/google-places";
import { after } from "next/server";
import { headers } from "next/headers";
import { getInstitutionRepository } from "@/server/institutions/repository";

/**
 * Schedules a non-blocking Google Business sync after a real user views a profile.
 * Bots, prefetch, and crawlers are ignored. Never blocks page render.
 */
export async function scheduleGoogleBusinessSyncIfNeeded(
  institution: Institution,
): Promise<void> {
  const headerList = await headers();
  if (!isGoogleSyncEligibleRequest(headerList)) {
    return;
  }

  const decision = decideGoogleBusinessSync(institution);
  if (decision.action === "skip") {
    return;
  }

  const institutionId = institutionIdAsString(institution.id);
  const geo = resolveGeoLabels(institution.location.cityId, institution.location.districtId);

  after(async () => {
    try {
      const institutionRepository = await getInstitutionRepository();
      const placesProvider = createGooglePlacesProviderFromEnv();
      await syncGoogleBusiness(
        {
          institutionId,
          cityName: geo.cityName,
        },
        { institutionRepository, placesProvider },
      );
    } catch (error) {
      console.error("[google-business] lazy sync failed", error);
    }
  });
}
