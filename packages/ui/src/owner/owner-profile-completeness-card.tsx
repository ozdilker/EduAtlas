import { cn } from "../lib/cn";
import type { OwnerProfileCompletenessView } from "./owner-portal-content";

export type OwnerProfileCompletenessCardProps = {
  completeness: OwnerProfileCompletenessView;
  className?: string;
};

/**
 * Profile Completeness card — not Growth Score. Read-only coaching tip.
 */
export function OwnerProfileCompletenessCard({
  completeness,
  className,
}: OwnerProfileCompletenessCardProps) {
  return (
    <section
      className={cn("ea-owner-widget", "ea-owner-widget--completeness", className)}
      aria-labelledby="owner-profile-completeness-heading"
    >
      <header className="ea-owner-widget__header">
        <h2 id="owner-profile-completeness-heading" className="ea-owner-widget__title">
          {completeness.title}
        </h2>
        <a href={completeness.profileHref} className="ea-owner-widget__link">
          Profili düzenle
        </a>
      </header>

      <p className="ea-owner-completeness__percent" aria-live="polite">
        <span className="ea-owner-completeness__value">{completeness.overallPercentage}%</span>
        <span className="ea-owner-completeness__label">tamamlandı</span>
      </p>

      <div className="ea-owner-completeness__meter" aria-hidden="true">
        <span
          className="ea-owner-completeness__meter-fill"
          style={{ width: `${completeness.overallPercentage}%` }}
        />
      </div>

      <p className="ea-owner-widget__description">{completeness.nextActionHint}</p>

      {completeness.missingSectionLabels.length > 0 ? (
        <p className="ea-owner-completeness__missing">
          Eksik: {completeness.missingSectionLabels.join(", ")}
        </p>
      ) : (
        <p className="ea-owner-completeness__missing" role="status">
          Tüm bölümler tamam.
        </p>
      )}
    </section>
  );
}
