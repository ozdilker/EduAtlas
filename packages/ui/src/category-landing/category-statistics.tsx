import { cn } from "../lib/cn";
import type { CategoryStatItem } from "./category-landing-content";

export type CategoryStatisticsProps = {
  statistics: CategoryStatItem[];
  className?: string;
};

/**
 * Category hub statistics — presentation figures only.
 */
export function CategoryStatistics({ statistics, className }: CategoryStatisticsProps) {
  if (statistics.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-category-section", "ea-category-stats", className)}
      aria-labelledby="category-stats-heading"
    >
      <h2 id="category-stats-heading" className="ea-category-section__title">
        Kategoriye bakış
      </h2>
      <ul className="ea-category-stats__list">
        {statistics.map((stat) => (
          <li key={stat.id} className="ea-category-stats__item">
            <p className="ea-category-stats__value">{stat.value}</p>
            <p className="ea-category-stats__label">{stat.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
