"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "../components/button";
import { getButtonClassName } from "../components/button-classes";
import { cn } from "../lib/cn";
import {
  isFavoriteInstitution,
  toggleFavoriteInstitution,
} from "../parent/parent-favorites-storage";
import type { InstitutionCardViewData } from "./institution-card-content";

export type InstitutionCardActionsProps = {
  name: string;
  href: string;
  ctaLabel?: string;
  showFavorite?: boolean;
  showCompare?: boolean;
  showShare?: boolean;
  showCta?: boolean;
  className?: string;
  /** When provided, favorite toggles persist to localStorage for the parent profile. */
  institution?: InstitutionCardViewData;
  onFavoriteClick?: () => void;
  onCompareClick?: () => void;
  onShareClick?: () => void;
  onCtaClick?: () => void;
};

/**
 * Card action controls — favorites persist locally when institution data is provided.
 */
export function InstitutionCardActions({
  name,
  href,
  ctaLabel = "İncele",
  showFavorite = true,
  showCompare = true,
  showShare = true,
  showCta = true,
  className,
  institution,
  onFavoriteClick,
  onCompareClick,
  onShareClick,
  onCtaClick,
}: InstitutionCardActionsProps) {
  const [favoritePressed, setFavoritePressed] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!institution) {
      return;
    }

    function syncFavorite() {
      if (!institution) {
        return;
      }
      setFavoritePressed(isFavoriteInstitution(institution.id));
    }

    syncFavorite();
    window.addEventListener("storage", syncFavorite);
    window.addEventListener("eduatlas:favorites-changed", syncFavorite);
    return () => {
      window.removeEventListener("storage", syncFavorite);
      window.removeEventListener("eduatlas:favorites-changed", syncFavorite);
    };
  }, [institution]);

  return (
    <div className={cn("ea-institution-card__actions", className)}>
      {showFavorite ? (
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          className="ea-institution-card__action-control"
          aria-label={
            favoritePressed ? `${name} favorilerden çıkar` : `${name} favorilere ekle`
          }
          aria-pressed={favoritePressed}
          aria-busy={isPending || undefined}
          disabled={isPending}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            if (!institution) {
              setFavoritePressed((value) => !value);
              onFavoriteClick?.();
              return;
            }

            const nextPressed = !isFavoriteInstitution(institution.id);
            setFavoritePressed(nextPressed);

            startTransition(() => {
              const next = toggleFavoriteInstitution(institution);
              setFavoritePressed(next.some((item) => item.id === institution.id));
              onFavoriteClick?.();
            });
          }}
        >
          {isPending ? "Kaydediliyor…" : favoritePressed ? "Favoride" : "Favori"}
        </Button>
      ) : null}

      {showCompare ? (
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          className="ea-institution-card__action-control"
          aria-label={`${name} karşılaştır`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onCompareClick?.();
          }}
        >
          Karşılaştır
        </Button>
      ) : null}

      {showShare ? (
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          className="ea-institution-card__action-control"
          aria-label={`${name} paylaş`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onShareClick?.();
          }}
        >
          Paylaş
        </Button>
      ) : null}

      {showCta ? (
        <a
          href={href}
          className={cn(
            getButtonClassName({ variant: "primary", size: "sm" }),
            "ea-institution-card__action-control",
            "ea-institution-card__cta",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onCtaClick?.();
          }}
        >
          {ctaLabel}
        </a>
      ) : null}
    </div>
  );
}
