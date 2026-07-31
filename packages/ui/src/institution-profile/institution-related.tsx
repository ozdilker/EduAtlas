"use client";

import { InstitutionCard } from "../institution/institution-card";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";

export type InstitutionRelatedProps = {
  institutions: InstitutionCardViewData[];
  className?: string;
};

/**
 * Related institutions rail using InstitutionCard.
 */
export function InstitutionRelated({ institutions, className }: InstitutionRelatedProps) {
  if (institutions.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-related", className)}
      aria-labelledby="institution-related-heading"
    >
      <h2 id="institution-related-heading" className="ea-profile-section__title">
        Benzer kurumlar
      </h2>
      <ul className="ea-profile-related__list">
        {institutions.map((institution) => (
          <li key={institution.id} className="ea-profile-related__item">
            <InstitutionCard
              data={institution}
              layout="compact"
              mediaPlacement="background"
              actions={{ showCompare: false, showShare: false }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
