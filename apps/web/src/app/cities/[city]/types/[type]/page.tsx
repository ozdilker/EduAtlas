import { HubPlaceholderPage } from "@eduatlas/ui";
import type { Metadata } from "next";

type CityTypeRouteProps = {
  params: Promise<{ city: string; type: string }>;
};

function labelize(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: CityTypeRouteProps): Promise<Metadata> {
  const { city, type } = await params;
  const cityLabel = labelize(city);
  const typeLabel = labelize(type);

  return {
    title: `${cityLabel} ${typeLabel}`,
    description: `${cityLabel} ${typeLabel} hub yer tutucusu.`,
    alternates: { canonical: `/cities/${city}/types/${type}` },
  };
}

export default async function CityTypeHubRoute({ params }: CityTypeRouteProps) {
  const { city, type } = await params;
  const cityLabel = labelize(city);
  const typeLabel = labelize(type);

  return (
    <HubPlaceholderPage
      title={`${cityLabel} ${typeLabel}`}
      description={`${cityLabel} içinde ${typeLabel} keşfi için şehir×kategori yer tutucusu.`}
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "cities", label: "Şehirler", href: "/cities" },
        { id: "city", label: cityLabel, href: `/cities/${city}` },
        { id: "type", label: typeLabel },
      ]}
      primaryHref={`/categories/${type}`}
      primaryLabel={`${typeLabel} kategori hub’ı`}
      nextSteps={[
        { id: "city", label: cityLabel, href: `/cities/${city}` },
        { id: "category", label: typeLabel, href: `/categories/${type}` },
        { id: "search", label: "Arama", href: "/search" },
        { id: "institutions", label: "Kurumlar", href: "/institutions" },
      ]}
    />
  );
}
