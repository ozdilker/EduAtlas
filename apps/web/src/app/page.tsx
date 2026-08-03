import { MetadataEngine } from "@eduatlas/seo";
import { HomePageView } from "@eduatlas/ui";
import { JsonLd } from "@/components/json-ld";
import { buildSeoSiteConfigFromContact, getSeoSiteConfig } from "@/lib/seo-site";
import { getHomeFeaturedInstitutionsView } from "@/server/institutions/get-home-featured-institutions";
import { getHomepageVisualsView } from "@/server/site/get-homepage-visuals-view";
import { getPublicOrganizationContact } from "@/server/site/get-public-organization-contact";
import { assertFirestoreReadsBudget, runWithFirestoreCounters } from "@eduatlas/firebase/monitoring";

const fallbackSite = getSeoSiteConfig();
const fallbackHomeSeo = MetadataEngine.resolve("home", fallbackSite);

export const revalidate = 3600;

export const metadata = fallbackHomeSeo.metadata;

export default async function HomePage() {
  return runWithFirestoreCounters(async () => {
    const [visuals, featured, contact] = await Promise.all([
      getHomepageVisualsView(),
      getHomeFeaturedInstitutionsView({ cityId: null }),
      getPublicOrganizationContact().catch(() => null),
    ]);

    assertFirestoreReadsBudget("home");

    const site = contact ? buildSeoSiteConfigFromContact(contact) : fallbackSite;
    const homeSeo = MetadataEngine.resolve("home", site);

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
