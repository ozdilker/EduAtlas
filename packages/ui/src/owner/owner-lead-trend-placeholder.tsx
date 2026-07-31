import { cn } from "../lib/cn";
import type { OwnerLeadTrendPlaceholderView } from "./owner-portal-content";

export type OwnerLeadTrendPlaceholderProps = {
  trend: OwnerLeadTrendPlaceholderView;
  className?: string;
};

/**
 * Lead trend chart placeholder — no analytics wiring in this sprint.
 */
export function OwnerLeadTrendPlaceholder({ trend, className }: OwnerLeadTrendPlaceholderProps) {
  return (
    <section
      className={cn("ea-owner-widget", "ea-owner-widget--placeholder", className)}
      aria-labelledby="owner-lead-trend-heading"
    >
      <h2 id="owner-lead-trend-heading" className="ea-owner-widget__title">
        {trend.title}
      </h2>
      <div className="ea-owner-placeholder-chart" role="img" aria-label="Talep trendi yer tutucu">
        <div className="ea-owner-placeholder-chart__bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <p className="ea-owner-widget__description">{trend.description}</p>
    </section>
  );
}
