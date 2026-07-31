import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { CategoryCityItem } from "./category-landing-content";

export type PopularCitiesProps = {
  cities: CategoryCityItem[];
  className?: string;
};

/**
 * Popular city × category shortcuts (future city/category combinations).
 */
export function PopularCities({ cities, className }: PopularCitiesProps) {
  if (cities.length === 0) {
    return null;
  }

  return (
    <section
      id="category-cities"
      className={cn("ea-category-section", "ea-category-cities", className)}
      aria-labelledby="category-cities-heading"
    >
      <h2 id="category-cities-heading" className="ea-category-section__title">
        Popüler şehirler
      </h2>
      <ul className="ea-category-cities__list">
        {cities.map((city) => (
          <li key={city.id}>
            <a href={city.href} className="ea-category-cities__link">
              <Badge tone="primary">{city.label}</Badge>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
