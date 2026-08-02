import { MetadataEngine } from "@eduatlas/seo";
import { HomePageView } from "@eduatlas/ui";
import { JsonLd } from "@/components/json-ld";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getHomeFeaturedInstitutionsView } from "@/server/institutions/get-home-featured-institutions";
import { getHomepageVisualsView } from "@/server/site/get-homepage-visuals-view";
import { assertFirestoreReadsBudget, runWithFirestoreCounters } from "@eduatlas/firebase/monitoring";

const site = getSeoSiteConfig();
const homeSeo = MetadataEngine.resolve("home", site);

export const revalidate = 3600;

export const metadata = homeSeo.metadata;

export default async function HomePage() {
  return runWithFirestoreCounters(async () => {
    const [visuals, featured] = await Promise.all([
      getHomepageVisualsView(),
      getHomeFeaturedInstitutionsView({ cityId: null }),
    ]);

    assertFirestoreReadsBudget("home");

    return (
      <>
        <JsonLd data={homeSeo.jsonLd} />
        <HomePageView
          appName={site.siteName}
          heroImageUrl={visuals.heroImageUrl}
          cityImageUrls={visuals.cityImageUrls}
          cities={visuals.cities}
          featuredInstitutions={featured.institutions}
        />
      </>
    );
  });
}
