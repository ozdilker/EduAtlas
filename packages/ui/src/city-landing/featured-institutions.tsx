"use client";

import { getButtonClassName } from "../components/button-classes";
import { InstitutionCard } from "../institution/institution-card";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";

export type FeaturedInstitutionsProps = {
  institutions: InstitutionCardViewData[];
  className?: string;
  sectionId?: string;
  heading?: string;
  emptyHref?: string;
  emptyLabel?: string;
  emptyMessage?: string;
};

/**
 * Featured institution cards for hub landings.
 */
export function FeaturedInstitutions({
  institutions,
  className,
  sectionId = "featured-institutions",
  heading = "Öne çıkan kurumlar",
  emptyHref = "/search",
  emptyLabel = "Arama sayfasında keşfet",
  emptyMessage = "Bu listede henüz yayınlı kurum yok.",
}: FeaturedInstitutionsProps) {
  const headingId = `${sectionId}-heading`;

  if (institutions.length === 0) {
    return (
      <section
        id={sectionId}
        className={cn("ea-city-section", "ea-city-featured", className)}
        aria-labelledby={headingId}
      >
        <h2 id={headingId} className="ea-city-section__title">
          {heading}
        </h2>
        <p className="ea-city-featured__empty">{emptyMessage}</p>
        <a
          href={emptyHref}
          className={cn(getButtonClassName({ variant: "secondary", size: "md" }))}
        >
          {emptyLabel}
        </a>
      </section>
    );
  }

  return (
    <section
      id={sectionId}
      className={cn("ea-city-section", "ea-city-featured", className)}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="ea-city-section__title">
        {heading}
      </h2>
      <ul className="ea-city-featured__list">
        {institutions.map((institution) => (
          <li key={institution.id} className="ea-city-featured__item">
            <InstitutionCard
              data={institution}
              layout="vertical"
              actions={{ showCompare: false, showShare: false }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
