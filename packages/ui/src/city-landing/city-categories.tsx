import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { CityCategoryItem } from "./city-landing-content";

export type CityCategoriesProps = {
  categories: CityCategoryItem[];
  className?: string;
};

/**
 * City × type category shortcuts.
 */
export function CityCategories({ categories, className }: CityCategoriesProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section
      id="city-categories"
      className={cn("ea-city-section", "ea-city-categories", className)}
      aria-labelledby="city-categories-heading"
    >
      <h2 id="city-categories-heading" className="ea-city-section__title">
        Kurum türleri
      </h2>
      <ul className="ea-city-categories__list">
        {categories.map((category) => (
          <li key={category.id}>
            <a href={category.href} className="ea-city-categories__link">
              <Badge tone="secondary">{category.label}</Badge>
              <span className="ea-city-categories__description">{category.description}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
