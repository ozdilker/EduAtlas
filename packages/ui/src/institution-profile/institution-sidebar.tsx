"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { getButtonClassName } from "../components/button-classes";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";
import {
  isFavoriteInstitution,
  toggleFavoriteInstitution,
} from "../parent/parent-favorites-storage";
import { InstitutionContact } from "./institution-contact";
import type { InstitutionProfileViewData } from "./institution-profile-content";
import { InstitutionSocialLinks } from "./institution-social-links";

export type InstitutionSidebarProps = {
  profile: InstitutionProfileViewData;
  onLeadClick?: () => void;
  className?: string;
};

function toFavoriteCard(profile: InstitutionProfileViewData): InstitutionCardViewData {
  const typeSlug = profile.typeHref.replace(/^\/categories\//, "").trim();

  return {
    id: profile.id,
    name: profile.name,
    href: `/institutions/${profile.slug}`,
    typeLabel: profile.typeLabel,
    ...(typeSlug ? { typeSlug } : {}),
    city: profile.city,
    district: profile.district,
    snippet: profile.summary,
    ...(profile.coverImageUrl ? { imageSrc: profile.coverImageUrl } : {}),
    badges: {
      verified: profile.verified,
      premium: profile.premium,
      featured: profile.featured,
    },
    ctaLabel: "İncele",
  };
}

/**
 * Profile sidebar with sticky CTA summary and contact snapshot.
 */
export function InstitutionSidebar({
  profile,
  onLeadClick,
  className,
}: InstitutionSidebarProps) {
  const phoneHref = profile.contact.find((item) => item.id === "phone")?.href;
  const [shareMessage, setShareMessage] = useState<string | undefined>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoritePending, startFavoriteTransition] = useTransition();
  const favoriteCard = toFavoriteCard(profile);

  useEffect(() => {
    function syncFavorite() {
      setIsFavorite(isFavoriteInstitution(profile.id));
    }

    syncFavorite();
    window.addEventListener("storage", syncFavorite);
    window.addEventListener("eduatlas:favorites-changed", syncFavorite);
    return () => {
      window.removeEventListener("storage", syncFavorite);
      window.removeEventListener("eduatlas:favorites-changed", syncFavorite);
    };
  }, [profile.id]);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = profile.name;
    const text = `${profile.name} — ${profile.district}, ${profile.city}`;

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      // Cancelled or failed — try clipboard.
    }

    try {
      if (url && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMessage("Bağlantı panoya kopyalandı.");
        window.setTimeout(() => setShareMessage(undefined), 2500);
        return;
      }
    } catch {
      // fall through
    }

    setShareMessage("Paylaşım yapılamadı.");
    window.setTimeout(() => setShareMessage(undefined), 2500);
  }

  function handleFavoriteToggle() {
    const nextPressed = !isFavoriteInstitution(profile.id);
    setIsFavorite(nextPressed);

    startFavoriteTransition(() => {
      const next = toggleFavoriteInstitution(favoriteCard);
      setIsFavorite(next.some((item) => item.id === profile.id));
    });
  }

  return (
    <aside
      className={cn("ea-profile-sidebar", className)}
      aria-labelledby="institution-sidebar-heading"
    >
      <h2 id="institution-sidebar-heading" className="ea-sr-only">
        Kurum özeti
      </h2>

      <div className="ea-profile-sidebar__card">
        <p className="ea-profile-sidebar__name">{profile.name}</p>
        <div className="ea-profile-sidebar__badges">
          <Badge tone="primary">{profile.typeLabel}</Badge>
          {profile.verified ? <Badge tone="success">Doğrulanmış</Badge> : null}
          {profile.premium ? <Badge tone="warning">Premium</Badge> : null}
        </div>
        <p className="ea-profile-sidebar__location">
          {profile.district}, {profile.city}
        </p>
        <div className="ea-profile-sidebar__actions">
          {onLeadClick ? (
            <Button type="button" variant="primary" size="md" onClick={onLeadClick}>
              Bilgi Al
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="md"
            aria-label={
              isFavorite
                ? `${profile.name} favorilerden çıkar`
                : `${profile.name} favorilere ekle`
            }
            aria-pressed={isFavorite}
            aria-busy={isFavoritePending || undefined}
            disabled={isFavoritePending}
            onClick={handleFavoriteToggle}
          >
            {isFavoritePending
              ? "Kaydediliyor…"
              : isFavorite
                ? "Favoride"
                : "Favorilere ekle"}
          </Button>
          {phoneHref ? (
            <a
              href={phoneHref}
              className={cn(getButtonClassName({ variant: "secondary", size: "md" }))}
            >
              Ara
            </a>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => void handleShare()}
          >
            Paylaş
          </Button>
        </div>
        {shareMessage ? (
          <p className="ea-profile-sidebar__share-status" role="status">
            {shareMessage}
          </p>
        ) : null}
      </div>

      <InstitutionContact items={profile.contact} />
      <InstitutionSocialLinks items={profile.socialLinks} />
    </aside>
  );
}
