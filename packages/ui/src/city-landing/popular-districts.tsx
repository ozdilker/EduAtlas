import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { CityDistrictItem } from "./city-landing-content";

export type PopularDistrictsProps = {
  districts: CityDistrictItem[];
  className?: string;
};

/**
 * Popular district shortcuts for the city hub.
 */
export function PopularDistricts({ districts, className }: PopularDistrictsProps) {
  if (districts.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-city-section", "ea-city-districts", className)}
      aria-labelledby="city-districts-heading"
    >
      <h2 id="city-districts-heading" className="ea-city-section__title">
        Popüler ilçeler
      </h2>
      <ul className="ea-city-districts__list">
        {districts.map((district) => (
          <li key={district.id}>
            <a href={district.href} className="ea-city-districts__link">
              <Badge tone="primary">{district.label}</Badge>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
