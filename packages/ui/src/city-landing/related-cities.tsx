import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { RelatedCityItem } from "./city-landing-content";

export type RelatedCitiesProps = {
  cities: RelatedCityItem[];
  className?: string;
};

/**
 * Related city hub links.
 */
export function RelatedCities({ cities, className }: RelatedCitiesProps) {
  if (cities.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-city-section", "ea-city-related", className)}
      aria-labelledby="city-related-heading"
    >
      <h2 id="city-related-heading" className="ea-city-section__title">
        Diğer şehirler
      </h2>
      <ul className="ea-city-related__list">
        {cities.map((city) => (
          <li key={city.id}>
            <a href={city.href} className="ea-city-related__link">
              <Badge tone="info">{city.label}</Badge>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
