"use client";

import { Container } from "../components/container";
import { PublicNextSteps } from "../layout/public-next-steps";
import { cn } from "../lib/cn";
import { Breadcrumb } from "./breadcrumb";
import { CityCategories } from "./city-categories";
import { CityGuides } from "./city-guides";
import { CityHero } from "./city-hero";
import { type CityLandingViewData, getStaticCityLanding } from "./city-landing-content";
import { CityStatistics } from "./city-statistics";
import { PopularDistricts } from "./popular-districts";
import { RelatedCities } from "./related-cities";

export type CityLandingPageProps = {
  citySlug?: string;
  city?: CityLandingViewData;
  className?: string;
};

/**
 * City landing / hub page — presentation only; data comes from the server loader.
 */
export function CityLandingPage({
  citySlug = "ankara",
  city = getStaticCityLanding(citySlug),
  className,
}: CityLandingPageProps) {
  const searchHref = `/search?city=${encodeURIComponent(city.slug)}`;

  return (
    <div className={cn("ea-city-landing", className)}>
      <Container size="xl" className="ea-city-landing__inner">
        <Breadcrumb items={city.breadcrumbs} />
        <CityHero city={city} />
        <CityStatistics statistics={city.statistics} />
        <CityCategories categories={city.categories} />
        <PopularDistricts districts={city.districts} />
        <CityGuides guides={city.guides} />
        <RelatedCities cities={city.relatedCities} />
        <PublicNextSteps
          title="Bu şehirden sonra"
          links={[
            { id: "categories", label: "Kurum tipleri", href: "/categories" },
            { id: "search", label: "Arama", href: searchHref },
            { id: "cities", label: "Tüm şehirler", href: "/cities" },
          ]}
        />
      </Container>
    </div>
  );
}
