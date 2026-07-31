import { Container } from "../components/container";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";
import { HomeCategories } from "./home-categories";
import { HomeCities } from "./home-cities";
import { HomeFeatured } from "./home-featured";
import { HomeHero, type HomeHeroCityOption } from "./home-hero";
import { HomeHowItWorks } from "./home-how-it-works";
import { HomeNewsletter } from "./home-newsletter";
import { HomeTrust } from "./home-trust";

export type HomePageViewProps = {
  appName?: string;
  heroImageUrl?: string;
  cityImageUrls?: Readonly<Partial<Record<string, string>>>;
  cities?: readonly HomeHeroCityOption[];
  featuredInstitutions?: readonly InstitutionCardViewData[];
  className?: string;
};

/**
 * Master Visual Reference homepage — stats live inside the hero strip.
 */
export function HomePageView({
  appName = "EduAtlas",
  heroImageUrl,
  cityImageUrls,
  cities,
  featuredInstitutions = [],
  className,
}: HomePageViewProps) {
  return (
    <div className={cn("ea-home-page", className)}>
      <HomeHero
        appName={appName}
        heroImageUrl={heroImageUrl}
        cityImageUrls={cityImageUrls}
        cities={cities}
      />
      <HomeFeatured institutions={featuredInstitutions} />
      <HomeCategories />
      <HomeCities cityImageUrls={cityImageUrls} />
      <HomeTrust />
      <HomeHowItWorks />
      <HomeNewsletter />
      <Container size="lg" className="ea-home-footer-note">
        <p>EduAtlas — Türkiye’nin eğitim atlası. Ailelere güvenli karar; kurumlara görünürlük.</p>
      </Container>
    </div>
  );
}
