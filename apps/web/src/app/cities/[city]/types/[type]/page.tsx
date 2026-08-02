import { MetadataEngine, resolveCategoryPluralLabel } from "@eduatlas/seo";
import { HubPlaceholderPage } from "@eduatlas/ui";
import { JsonLd } from "@/components/json-ld";
import { getSeoSiteConfig } from "@/lib/seo-site";
import {
  resolveGeoHubLabels,
  resolveTypeHubLabel,
} from "@/server/seo/resolve-geo-hub-labels";

type CityTypeRouteProps = {
  params: Promise<{ city: string; type: string }>;
};

export async function generateMetadata({ params }: CityTypeRouteProps) {
  const { city, type } = await params;
  const geo = resolveGeoHubLabels(city);
  const typeName = resolveTypeHubLabel(type);
  return MetadataEngine.resolve("city-type", getSeoSiteConfig(), {
    citySlug: geo?.citySlug ?? city,
    typeSlug: type,
    cityName: geo?.cityName,
    typeName,
  }).metadata;
}

export default async function CityTypeHubRoute({ params }: CityTypeRouteProps) {
  const { city, type } = await params;
  const geo = resolveGeoHubLabels(city);
  const cityLabel = geo?.cityName ?? city;
  const citySlug = geo?.citySlug ?? city;
  const typeName = resolveTypeHubLabel(type);
  const plural = resolveCategoryPluralLabel(type, typeName);

  const pageSeo = MetadataEngine.resolve("city-type", getSeoSiteConfig(), {
    citySlug,
    typeSlug: type,
    cityName: geo?.cityName,
    typeName,
    items: [],
  });

  return (
    <>
      <JsonLd data={pageSeo.jsonLd} />
      <HubPlaceholderPage
        title={`${cityLabel} ${plural}`}
        description={`${cityLabel} içinde ${typeName} keşfi için şehir×kategori yer tutucusu.`}
        breadcrumbs={[
          { id: "home", label: "Ana sayfa", href: "/" },
          { id: "cities", label: "Şehirler", href: "/cities" },
          { id: "city", label: cityLabel, href: `/cities/${citySlug}` },
          { id: "type", label: plural },
        ]}
        primaryHref={`/categories/${type}`}
        primaryLabel={`${typeName} kategori hub’ı`}
        nextSteps={[
          { id: "city", label: cityLabel, href: `/cities/${citySlug}` },
          { id: "category", label: typeName, href: `/categories/${type}` },
          { id: "search", label: "Arama", href: "/search" },
          { id: "institutions", label: "Kurumlar", href: "/institutions" },
        ]}
      />
    </>
  );
}
