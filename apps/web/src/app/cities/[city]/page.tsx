import { buildCityPageSeo } from "@eduatlas/seo";
import { CityLandingPage } from "@eduatlas/ui";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getCityLandingView } from "@/server/cities/get-city-landing-view";
import { buildTurkeyGeographySeedCatalog } from "@eduatlas/firebase/server";
import { assertFirestoreReadsBudget, runWithFirestoreCounters } from "@eduatlas/firebase/monitoring";

type CityLandingRouteProps = {
  params: Promise<{
    city: string;
  }>;
};

export async function generateMetadata({ params }: CityLandingRouteProps) {
  const { city } = await params;
  return buildCityPageSeo(getSeoSiteConfig(), { citySlug: city }).metadata;
}

export async function generateStaticParams(): Promise<{ city: string }[]> {
  const catalog = buildTurkeyGeographySeedCatalog();
  return catalog.cities.map((c) => ({ city: c.slug }));
}

export const revalidate = 1800;

export default async function CityLandingRoute({ params }: CityLandingRouteProps) {
  return runWithFirestoreCounters(async () => {
    const { city } = await params;
    const landing = await getCityLandingView(city);

    if (!landing) {
      notFound();
    }

    assertFirestoreReadsBudget("city");

    const pageSeo = buildCityPageSeo(getSeoSiteConfig(), { citySlug: landing.slug });

    return (
      <>
        <JsonLd data={pageSeo.jsonLd} />
        <CityLandingPage citySlug={landing.slug} city={landing} />
      </>
    );
  });
}
