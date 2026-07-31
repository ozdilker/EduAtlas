import { Card } from "../components/card";
import { cn } from "../lib/cn";
import {
  InstitutionCardActions,
  type InstitutionCardActionsProps,
} from "./institution-card-actions";
import { InstitutionCardBadges } from "./institution-card-badges";
import { getInstitutionCardClassName } from "./institution-card-classes";
import type { InstitutionCardLayout, InstitutionCardViewData } from "./institution-card-content";
import { InstitutionCardFooter } from "./institution-card-footer";
import { InstitutionCardHeader } from "./institution-card-header";
import { InstitutionCardImage } from "./institution-card-image";
import { resolveInstitutionCardImageSrc } from "./institution-card-image-src";
import { InstitutionCardMeta } from "./institution-card-meta";

export type InstitutionCardMediaPlacement = "inline" | "background";

export type InstitutionCardProps = {
  data: InstitutionCardViewData;
  layout?: InstitutionCardLayout;
  /** `background` = full-bleed photo + 50% opaque info overlay (shared card chrome). */
  mediaPlacement?: InstitutionCardMediaPlacement;
  headingLevel?: 2 | 3 | 4;
  className?: string;
  actions?: Partial<
    Pick<
      InstitutionCardActionsProps,
      | "showFavorite"
      | "showCompare"
      | "showShare"
      | "showCta"
      | "onFavoriteClick"
      | "onCompareClick"
      | "onShareClick"
      | "onCtaClick"
    >
  >;
};

/**
 * Reusable institution result card — entire surface is keyboard-activatable via
 * a stretched link; action controls stay independently focusable.
 *
 * Hierarchy: name → location → rating → trust → programs → distance → actions.
 */
export function InstitutionCard({
  data,
  layout = "vertical",
  mediaPlacement = "inline",
  headingLevel = 3,
  className,
  actions,
}: InstitutionCardProps) {
  const compact = layout === "compact" && mediaPlacement === "inline";
  const titleId = `institution-card-title-${data.id}`;
  const imageSrc = resolveInstitutionCardImageSrc({
    imageSrc: data.imageSrc,
    typeLabel: data.typeLabel,
    typeSlug: data.typeSlug,
  });
  const photoBackground = mediaPlacement === "background";

  return (
    <article
      className={getInstitutionCardClassName({
        layout: photoBackground ? "vertical" : layout,
        className: cn(photoBackground && "ea-institution-card--photo-bg", className),
      })}
      aria-labelledby={titleId}
    >
      <Card interactive padding="default" className="ea-institution-card__surface">
        <a href={data.href} className="ea-institution-card__hit" aria-labelledby={titleId}>
          <span className="ea-sr-only">{data.name} kurumunu incele</span>
        </a>

        <InstitutionCardImage
          src={imageSrc}
          alt={data.imageAlt ?? ""}
          className={cn(
            "ea-institution-card__media-slot",
            photoBackground && "ea-institution-card__media-slot--background",
          )}
        />

        <div
          className={cn(
            "ea-institution-card__body",
            photoBackground && "ea-institution-card__body--overlay",
          )}
        >
          <InstitutionCardHeader
            name={data.name}
            snippet={compact || photoBackground ? undefined : data.snippet}
            headingId={titleId}
            headingLevel={headingLevel}
          />

          <InstitutionCardMeta
            city={data.city}
            district={data.district}
            ratingPlaceholder={data.ratingPlaceholder}
            reviewCountPlaceholder={
              compact || photoBackground ? undefined : data.reviewCountPlaceholder
            }
          />

          <InstitutionCardBadges badges={data.badges} variant="trust" />

          <InstitutionCardBadges
            typeLabel={data.typeLabel}
            programLabels={photoBackground ? undefined : data.programLabels}
            variant="programs"
          />

          {data.distanceLabel && !photoBackground ? (
            <p className="ea-institution-card__distance">
              <span className="ea-sr-only">Mesafe: </span>
              {data.distanceLabel}
            </p>
          ) : null}

          <InstitutionCardFooter>
            <InstitutionCardActions
              name={data.name}
              href={data.href}
              ctaLabel={data.ctaLabel}
              institution={data}
              showFavorite={actions?.showFavorite}
              showCompare={actions?.showCompare ?? false}
              showShare={actions?.showShare ?? false}
              showCta={actions?.showCta}
              onFavoriteClick={actions?.onFavoriteClick}
              onCompareClick={actions?.onCompareClick}
              onShareClick={actions?.onShareClick}
              onCtaClick={actions?.onCtaClick}
            />
          </InstitutionCardFooter>
        </div>
      </Card>
    </article>
  );
}
