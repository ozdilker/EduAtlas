import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { RelatedCategoryItem } from "./category-landing-content";

export type RelatedCategoriesProps = {
  categories: RelatedCategoryItem[];
  className?: string;
};

/**
 * Related category hub links.
 */
export function RelatedCategories({ categories, className }: RelatedCategoriesProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-category-section", "ea-category-related", className)}
      aria-labelledby="category-related-heading"
    >
      <h2 id="category-related-heading" className="ea-category-section__title">
        İlgili kategoriler
      </h2>
      <ul className="ea-category-related__list">
        {categories.map((category) => (
          <li key={category.id}>
            <a href={category.href} className="ea-category-related__link">
              <Badge tone="secondary">{category.label}</Badge>
              <span className="ea-category-related__description">{category.description}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
