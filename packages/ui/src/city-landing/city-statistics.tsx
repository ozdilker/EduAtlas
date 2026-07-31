import { cn } from "../lib/cn";
import type { CityStatItem } from "./city-landing-content";

export type CityStatisticsProps = {
  statistics: CityStatItem[];
  className?: string;
};

/**
 * City hub statistics — presentation figures only.
 */
export function CityStatistics({ statistics, className }: CityStatisticsProps) {
  if (statistics.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-city-section", "ea-city-stats", className)}
      aria-labelledby="city-stats-heading"
    >
      <h2 id="city-stats-heading" className="ea-city-section__title">
        Şehre bakış
      </h2>
      <ul className="ea-city-stats__list">
        {statistics.map((stat) => (
          <li key={stat.id} className="ea-city-stats__item">
            <p className="ea-city-stats__value">{stat.value}</p>
            <p className="ea-city-stats__label">{stat.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
