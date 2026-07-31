import { getButtonClassName } from "../components/button-classes";
import { cn } from "../lib/cn";
import type { CityLandingViewData } from "./city-landing-content";

export type CityHeroProps = {
  city: Pick<CityLandingViewData, "name" | "title" | "description" | "slug">;
  className?: string;
};

/**
 * City hub hero — title, intro, and discovery CTAs.
 */
export function CityHero({ city, className }: CityHeroProps) {
  const searchHref = `/search?city=${encodeURIComponent(city.slug)}`;

  return (
    <section className={cn("ea-city-hero", className)} aria-labelledby="city-landing-title">
      <div className="ea-city-hero__inner">
        <h1 id="city-landing-title" className="ea-city-hero__title">
          {city.title}
        </h1>
        <p className="ea-city-hero__description">{city.description}</p>
        <div className="ea-city-hero__actions">
          <a
            href={searchHref}
            className={cn(getButtonClassName({ variant: "primary", size: "lg" }))}
          >
            Arama’da gör
          </a>
          <a
            href="#city-districts"
            className={cn(getButtonClassName({ variant: "secondary", size: "lg" }))}
          >
            İlçelere git
          </a>
        </div>
      </div>
    </section>
  );
}
