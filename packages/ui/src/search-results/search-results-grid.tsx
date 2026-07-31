"use client";

import { InstitutionCard } from "../institution/institution-card";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";
import { getStaticSearchResultInstitutions } from "./search-results-content";

export type SearchResultsGridProps = {
  institutions?: InstitutionCardViewData[];
  className?: string;
};

/**
 * Responsive grid of static institution cards.
 */
export function SearchResultsGrid({
  institutions = getStaticSearchResultInstitutions(),
  className,
}: SearchResultsGridProps) {
  return (
    <section
      className={cn("ea-search-results__grid-section", className)}
      aria-labelledby="search-results-grid-heading"
    >
      <h2 id="search-results-grid-heading" className="ea-sr-only">
        Arama sonuçları
      </h2>
      <ul className="ea-search-results__grid">
        {institutions.map((institution) => (
          <li key={institution.id} className="ea-search-results__grid-item">
            <InstitutionCard
              data={institution}
              layout="horizontal"
              actions={{ showFavorite: true, showCta: true }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
