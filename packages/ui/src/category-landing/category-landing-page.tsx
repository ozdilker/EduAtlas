"use client";

import { Breadcrumb } from "../city-landing/breadcrumb";
import { Container } from "../components/container";
import { PublicNextSteps } from "../layout/public-next-steps";
import { cn } from "../lib/cn";
import { BuyingGuide } from "./buying-guide";
import { CategoryHero } from "./category-hero";
import { type CategoryLandingViewData, getStaticCategoryLanding } from "./category-landing-content";
import { CategoryStatistics } from "./category-statistics";
import { FAQPreview } from "./faq-preview";
import { PopularCities } from "./popular-cities";
import { RelatedCategories } from "./related-categories";

export type CategoryLandingPageProps = {
  categorySlug?: string;
  category?: CategoryLandingViewData;
  className?: string;
};

/**
 * Static category / type landing page — UI composition only.
 */
export function CategoryLandingPage({
  categorySlug = "dershane",
  category = getStaticCategoryLanding(categorySlug),
  className,
}: CategoryLandingPageProps) {
  const searchHref = `/search?type=${encodeURIComponent(category.typeId)}`;

  return (
    <div className={cn("ea-category-landing", className)}>
      <Container size="xl" className="ea-category-landing__inner">
        <Breadcrumb items={category.breadcrumbs} />
        <CategoryHero category={category} />
        <CategoryStatistics statistics={category.statistics} />
        <PopularCities cities={category.popularCities} />
        <RelatedCategories categories={category.relatedCategories} />
        <BuyingGuide sections={category.buyingGuide} />
        <FAQPreview faqs={category.faqs} />
        <PublicNextSteps
          title="Bu kategoriden sonra"
          links={[
            { id: "cities", label: "Şehirler", href: "/cities" },
            { id: "search", label: "Arama", href: searchHref },
            { id: "categories", label: "Tüm tipler", href: "/categories" },
          ]}
        />
      </Container>
    </div>
  );
}
