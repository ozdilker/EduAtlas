import { HubPlaceholderPage } from "@eduatlas/ui";
import type { Metadata } from "next";

type DistrictRouteProps = {
  params: Promise<{ city: string; district: string }>;
};

function labelize(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: DistrictRouteProps): Promise<Metadata> {
  const { city, district } = await params;
  const cityLabel = labelize(city);
  const districtLabel = labelize(district);

  return {
    title: `${districtLabel}, ${cityLabel}`,
    description: `${districtLabel} eğitim kurumları — statik hub yer tutucusu.`,
    alternates: { canonical: `/cities/${city}/${district}` },
  };
}

export default async function DistrictHubRoute({ params }: DistrictRouteProps) {
  const { city, district } = await params;
  const cityLabel = labelize(city);
  const districtLabel = labelize(district);

  return (
    <HubPlaceholderPage
      title={`${districtLabel}’da Eğitim Kurumları`}
      description={`${cityLabel} / ${districtLabel} için ilçe hub yer tutucusu. Detaylı liste sonraki sprintlerde bağlanacaktır.`}
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "cities", label: "Şehirler", href: "/cities" },
        { id: "city", label: cityLabel, href: `/cities/${city}` },
        { id: "district", label: districtLabel },
      ]}
      primaryHref={`/cities/${city}`}
      primaryLabel={`${cityLabel} hub’ına dön`}
      nextSteps={[
        { id: "city", label: cityLabel, href: `/cities/${city}` },
        { id: "search", label: "Arama", href: "/search" },
        { id: "categories", label: "Kurum tipleri", href: "/categories" },
        { id: "sample", label: "Örnek kurum", href: "/institutions/ornek-anaokulu" },
      ]}
    />
  );
}
