import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { OwnerInstitutionSummaryView } from "./owner-portal-content";

export type OwnerInstitutionSummaryWidgetProps = {
  summary: OwnerInstitutionSummaryView;
  className?: string;
};

/**
 * Institution summary widget for the owner dashboard.
 */
export function OwnerInstitutionSummaryWidget({
  summary,
  className,
}: OwnerInstitutionSummaryWidgetProps) {
  return (
    <section
      className={cn("ea-owner-widget", "ea-owner-widget--institution", className)}
      aria-labelledby="owner-institution-summary-heading"
    >
      <header className="ea-owner-widget__header">
        <h2 id="owner-institution-summary-heading" className="ea-owner-widget__title">
          Kurum özeti
        </h2>
        <a href={summary.publicProfileHref} className="ea-owner-widget__link">
          Genel profil
        </a>
      </header>
      <p className="ea-owner-widget__name">{summary.name}</p>
      <div className="ea-owner-widget__badges">
        <Badge tone="primary">{summary.typeLabel}</Badge>
        <Badge tone="neutral">{summary.verificationLabel}</Badge>
      </div>
      <p className="ea-owner-widget__meta">
        {summary.district}, {summary.city}
      </p>
      {summary.shortDescription ? (
        <p className="ea-owner-widget__description">{summary.shortDescription}</p>
      ) : null}
    </section>
  );
}
