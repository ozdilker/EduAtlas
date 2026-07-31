import { cn } from "../lib/cn";
import type { InstitutionHighlight } from "./institution-profile-content";

export type InstitutionHighlightsProps = {
  highlights: InstitutionHighlight[];
  className?: string;
};

/**
 * Highlight / advantage cards for the profile.
 */
export function InstitutionHighlights({ highlights, className }: InstitutionHighlightsProps) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-highlights", className)}
      aria-labelledby="institution-highlights-heading"
    >
      <h2 id="institution-highlights-heading" className="ea-profile-section__title">
        Öne çıkan özellikler
      </h2>
      <ul className="ea-profile-highlights__list">
        {highlights.map((item) => (
          <li key={item.id} className="ea-profile-highlights__item">
            <h3 className="ea-profile-highlights__item-title">{item.title}</h3>
            <p className="ea-profile-highlights__item-text">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
