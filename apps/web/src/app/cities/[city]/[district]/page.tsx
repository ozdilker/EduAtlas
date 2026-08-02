import { MetadataEngine } from "@eduatlas/seo";
import { HubPlaceholderPage } from "@eduatlas/ui";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { resolveGeoHubLabels } from "@/server/seo/resolve-geo-hub-labels";

type DistrictRouteProps = {
  params: Promise<{ city: string; district: string }>;
};

export async function generateMetadata({ params }: DistrictRouteProps) {
  const { city, district } = await params;
  const geo = resolveGeoHubLabels(city, district);
  return MetadataEngine.resolve("district", getSeoSiteConfig(), {
    citySlug: geo?.citySlug ?? city,
    districtSlug: geo?.districtSlug ?? district,
    cityName: geo?.cityName,
    districtName: geo?.districtName,
  }).metadata;
}

export default async function DistrictHubRoute({ params }: DistrictRouteProps) {
  const { city, district } = await params;
  const geo = resolveGeoHubLabels(city, district);
  const cityLabel = geo?.cityName ?? city;
  const districtLabel = geo?.districtName ?? district;
  const citySlug = geo?.citySlug ?? city;

  return (
    <HubPlaceholderPage
      title={`${districtLabel}’da Eğitim Kurumları`}
      description={`${cityLabel} / ${districtLabel} için ilçe hub yer tutucusu. Detaylı liste sonraki sprintlerde bağlanacaktır.`}
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "cities", label: "Şehirler", href: "/cities" },
        { id: "city", label: cityLabel, href: `/cities/${citySlug}` },
        { id: "district", label: districtLabel },
      ]}
      primaryHref={`/cities/${citySlug}`}
      primaryLabel={`${cityLabel} hub’ına dön`}
      nextSteps={[
        { id: "city", label: cityLabel, href: `/cities/${citySlug}` },
        { id: "search", label: "Arama", href: "/search" },
        { id: "categories", label: "Kurum tipleri", href: "/categories" },
        { id: "sample", label: "Örnek kurum", href: "/institutions/ornek-anaokulu" },
      ]}
    />
  );
}
