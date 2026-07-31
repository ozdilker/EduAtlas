import { createElement } from "react";
import { cn } from "../lib/cn";

export type InstitutionCardHeaderProps = {
  name: string;
  snippet?: string;
  headingId?: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

/**
 * Primary card identity — text only; navigation is the stretched card link.
 */
export function InstitutionCardHeader({
  name,
  snippet,
  headingId,
  headingLevel = 3,
  className,
}: InstitutionCardHeaderProps) {
  return (
    <header className={cn("ea-institution-card__header", className)}>
      {createElement(
        `h${headingLevel}`,
        { id: headingId, className: "ea-institution-card__title" },
        name,
      )}
      {snippet ? <p className="ea-institution-card__snippet">{snippet}</p> : null}
    </header>
  );
}
