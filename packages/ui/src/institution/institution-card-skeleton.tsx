import { Card } from "../components/card";
import { cn } from "../lib/cn";
import { getInstitutionCardSkeletonClassName } from "./institution-card-classes";
import type { InstitutionCardLayout } from "./institution-card-content";

export type InstitutionCardSkeletonProps = {
  layout?: InstitutionCardLayout;
  className?: string;
};

/**
 * Loading placeholder matching the decision-card hierarchy.
 */
export function InstitutionCardSkeleton({
  layout = "vertical",
  className,
}: InstitutionCardSkeletonProps) {
  return (
    <div
      className={cn(
        getInstitutionCardSkeletonClassName(className),
        `ea-institution-card--${layout}`,
      )}
      aria-hidden="true"
    >
      <Card padding="default" className="ea-institution-card__surface">
        <div className="ea-institution-card__media ea-institution-card__skeleton-block" />
        <div className="ea-institution-card__body">
          <div className="ea-institution-card__skeleton-line ea-institution-card__skeleton-line--sm" />
          <div className="ea-institution-card__skeleton-line ea-institution-card__skeleton-line--lg" />
          <div className="ea-institution-card__skeleton-line ea-institution-card__skeleton-line--md" />
          <div className="ea-institution-card__skeleton-line ea-institution-card__skeleton-line--sm" />
          <div className="ea-institution-card__skeleton-line" />
        </div>
      </Card>
    </div>
  );
}
