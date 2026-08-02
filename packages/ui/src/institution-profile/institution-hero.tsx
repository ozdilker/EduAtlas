import { EduAtlasLogo } from "../brand/eduatlas-logo";
import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import type { InstitutionProfileViewData } from "./institution-profile-content";

export type InstitutionHeroProps = {
  profile: InstitutionProfileViewData;
  className?: string;
};

/**
 * Profile hero — identity, badges, and media (actions live in the sidebar).
 */
export function InstitutionHero({ profile, className }: InstitutionHeroProps) {
  const coverImageUrl = profile.coverImageUrl?.trim();
  const logoUrl = profile.logoUrl?.trim();

  return (
    <section
      className={cn("ea-profile-hero", className)}
      aria-labelledby="institution-profile-title"
    >
      <div className="ea-profile-hero__cover" aria-hidden={coverImageUrl ? undefined : true}>
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="" className="ea-profile-hero__cover-image" />
        ) : (
          <div className="ea-profile-hero__cover-placeholder" />
        )}
      </div>

      <div className="ea-profile-hero__body">
        <div className="ea-profile-hero__logo">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${profile.name} logosu`}
              className="ea-profile-hero__logo-image"
            />
          ) : (
            <EduAtlasLogo variant="small" title="" className="ea-profile-hero__logo-mark" />
          )}
        </div>

        <div className="ea-profile-hero__identity">
          <ul className="ea-profile-hero__badges" aria-label="Kurum etiketleri">
            <li>
              <Badge tone="primary">{profile.typeLabel}</Badge>
            </li>
            {profile.verified ? (
              <li>
                <Badge tone="success">Doğrulanmış</Badge>
              </li>
            ) : null}
            {profile.premium ? (
              <li>
                <Badge tone="warning">Premium</Badge>
              </li>
            ) : null}
            {profile.featured ? (
              <li>
                <Badge tone="info">Öne çıkan</Badge>
              </li>
            ) : null}
          </ul>

          <h1 id="institution-profile-title" className="ea-profile-hero__title">
            {profile.name}
          </h1>

          {profile.googleRating !== undefined ? (
            <p className="ea-profile-hero__google-rating" aria-label="Google puanı">
              <span className="ea-profile-hero__google-rating-star" aria-hidden="true">
                ★
              </span>
              <span className="ea-profile-hero__google-rating-value">
                {formatGoogleRating(profile.googleRating)}
              </span>
              {profile.googleReviewCount !== undefined ? (
                <span className="ea-profile-hero__google-rating-count">
                  ({formatReviewCount(profile.googleReviewCount)} Google değerlendirme)
                </span>
              ) : null}
            </p>
          ) : null}

          <p className="ea-profile-hero__location">
            <a href={profile.typeHref}>{profile.typeLabel}</a>
            <span aria-hidden="true"> · </span>
            <a href={profile.districtHref}>{profile.district}</a>
            <span aria-hidden="true">, </span>
            <a href={profile.cityHref}>{profile.city}</a>
          </p>

          <p className="ea-profile-hero__summary">{profile.summary}</p>
        </div>
      </div>
    </section>
  );
}

function formatGoogleRating(rating: number): string {
  return rating.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatReviewCount(count: number): string {
  return count.toLocaleString("tr-TR");
}
