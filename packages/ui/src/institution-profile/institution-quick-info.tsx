import { cn } from "../lib/cn";
import type { InstitutionQuickFact } from "./institution-profile-content";

export type InstitutionQuickInfoProps = {
  facts: InstitutionQuickFact[];
  className?: string;
};

/**
 * Scannable quick facts grid.
 */
export function InstitutionQuickInfo({ facts, className }: InstitutionQuickInfoProps) {
  if (facts.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-profile-section", "ea-profile-quickinfo", className)}
      aria-labelledby="institution-quickinfo-heading"
    >
      <h2 id="institution-quickinfo-heading" className="ea-profile-section__title">
        Hızlı bilgiler
      </h2>
      <dl className="ea-profile-quickinfo__grid">
        {facts.map((fact) => (
          <div key={fact.id} className="ea-profile-quickinfo__item">
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
