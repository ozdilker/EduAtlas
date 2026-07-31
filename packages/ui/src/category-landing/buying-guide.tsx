import { cn } from "../lib/cn";
import type { BuyingGuideSection } from "./category-landing-content";

export type BuyingGuideProps = {
  sections: BuyingGuideSection[];
  className?: string;
};

/**
 * Buying / selection guide for the category hub.
 */
export function BuyingGuide({ sections, className }: BuyingGuideProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-category-section", "ea-category-guide", className)}
      aria-labelledby="category-guide-heading"
    >
      <h2 id="category-guide-heading" className="ea-category-section__title">
        Seçim rehberi
      </h2>
      <ol className="ea-category-guide__list">
        {sections.map((section, index) => (
          <li key={section.id} className="ea-category-guide__item">
            <p className="ea-category-guide__step" aria-hidden="true">
              {index + 1}
            </p>
            <div>
              <h3 className="ea-category-guide__title">{section.title}</h3>
              <p className="ea-category-guide__body">{section.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
