import { cn } from "../lib/cn";
import type { CityGuideItem } from "./city-landing-content";

export type CityGuidesProps = {
  guides: CityGuideItem[];
  className?: string;
};

/**
 * City guide teasers — static editorial placeholders.
 */
export function CityGuides({ guides, className }: CityGuidesProps) {
  if (guides.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-city-section", "ea-city-guides", className)}
      aria-labelledby="city-guides-heading"
    >
      <h2 id="city-guides-heading" className="ea-city-section__title">
        Şehir rehberleri
      </h2>
      <ul className="ea-city-guides__list">
        {guides.map((guide) => (
          <li key={guide.id} className="ea-city-guides__item">
            <a href={guide.href} className="ea-city-guides__link">
              <h3 className="ea-city-guides__title">{guide.title}</h3>
              <p className="ea-city-guides__summary">{guide.summary}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
