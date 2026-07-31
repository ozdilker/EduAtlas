import { getButtonClassName } from "../components/button-classes";
import { cn } from "../lib/cn";
import type { CategoryLandingViewData } from "./category-landing-content";

export type CategoryHeroProps = {
  category: Pick<CategoryLandingViewData, "name" | "title" | "description" | "typeId">;
  className?: string;
};

/**
 * National category hub hero.
 */
export function CategoryHero({ category, className }: CategoryHeroProps) {
  return (
    <section className={cn("ea-category-hero", className)} aria-labelledby="category-landing-title">
      <div className="ea-category-hero__inner">
        <h1 id="category-landing-title" className="ea-category-hero__title">
          {category.title}
        </h1>
        <p className="ea-category-hero__description">{category.description}</p>
        <div className="ea-category-hero__actions">
          <a
            href={`/search?type=${encodeURIComponent(category.typeId)}`}
            className={cn(getButtonClassName({ variant: "primary", size: "lg" }))}
          >
            Arama’da gör
          </a>
          <a
            href="#category-cities"
            className={cn(getButtonClassName({ variant: "secondary", size: "lg" }))}
          >
            Popüler şehirlere git
          </a>
        </div>
      </div>
    </section>
  );
}
