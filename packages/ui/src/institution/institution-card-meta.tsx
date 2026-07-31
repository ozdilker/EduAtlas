import { cn } from "../lib/cn";

export type InstitutionCardMetaProps = {
  city?: string;
  district?: string;
  ratingPlaceholder?: string;
  reviewCountPlaceholder?: string;
  studentCountPlaceholder?: string;
  distanceLabel?: string;
  className?: string;
};

/**
 * Location, rating, and optional distance — presentation only.
 */
export function InstitutionCardMeta({
  city,
  district,
  ratingPlaceholder,
  reviewCountPlaceholder,
  studentCountPlaceholder,
  distanceLabel,
  className,
}: InstitutionCardMetaProps) {
  const location = [district, city].filter(Boolean).join(", ");
  const hasMetrics = Boolean(
    ratingPlaceholder || reviewCountPlaceholder || studentCountPlaceholder || distanceLabel,
  );

  if (!location && !hasMetrics) {
    return null;
  }

  return (
    <dl className={cn("ea-institution-card__meta", className)}>
      {location ? (
        <div className="ea-institution-card__meta-row ea-institution-card__meta-row--location">
          <dt className="ea-sr-only">Konum</dt>
          <dd className="ea-institution-card__meta-value">{location}</dd>
        </div>
      ) : null}
      {ratingPlaceholder ? (
        <div className="ea-institution-card__meta-row ea-institution-card__meta-row--rating">
          <dt className="ea-sr-only">Puan</dt>
          <dd className="ea-institution-card__meta-value">
            <span className="ea-institution-card__rating" aria-hidden="true">
              ★
            </span>
            <span>{ratingPlaceholder}</span>
            {reviewCountPlaceholder ? (
              <span className="ea-institution-card__rating-count">{reviewCountPlaceholder}</span>
            ) : null}
          </dd>
        </div>
      ) : null}
      {!ratingPlaceholder && reviewCountPlaceholder ? (
        <div className="ea-institution-card__meta-row">
          <dt className="ea-sr-only">Değerlendirme</dt>
          <dd className="ea-institution-card__meta-value">{reviewCountPlaceholder}</dd>
        </div>
      ) : null}
      {distanceLabel ? (
        <div className="ea-institution-card__meta-row ea-institution-card__meta-row--distance">
          <dt className="ea-sr-only">Mesafe</dt>
          <dd className="ea-institution-card__meta-value">{distanceLabel}</dd>
        </div>
      ) : null}
      {studentCountPlaceholder ? (
        <div className="ea-institution-card__meta-row">
          <dt className="ea-sr-only">Öğrenci sayısı</dt>
          <dd className="ea-institution-card__meta-value">{studentCountPlaceholder}</dd>
        </div>
      ) : null}
    </dl>
  );
}
