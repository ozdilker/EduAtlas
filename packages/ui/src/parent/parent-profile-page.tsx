"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { LogoutButton } from "../auth/logout-button";
import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { InstitutionCard } from "../institution/institution-card";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";
import {
  FAVORITES_STORAGE_KEY,
  readFavoriteInstitutions,
  removeFavoriteInstitution,
  writeFavoriteInstitutions,
} from "./parent-favorites-storage";
import { getLastSearchCityId } from "./parent-search-location-storage";

export type ParentProfilePageProps = {
  displayName?: string;
  email: string;
  logoutAction?: () => Promise<void>;
  className?: string;
};

const COMPARE_LIMIT = 3;

/**
 * Parent profile — favorites list + side-by-side compare (local favorites).
 */
export function ParentProfilePage({
  displayName,
  email,
  logoutAction,
  className,
}: ParentProfilePageProps) {
  const [favorites, setFavorites] = useState<InstitutionCardViewData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFavorites(readFavoriteInstitutions());
    setMounted(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        setFavorites(readFavoriteInstitutions());
      }
    };
    window.addEventListener("storage", onStorage);
    const onLocal = () => setFavorites(readFavoriteInstitutions());
    window.addEventListener("eduatlas:favorites-changed", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("eduatlas:favorites-changed", onLocal);
    };
  }, []);

  const compareItems = useMemo(
    () => favorites.filter((item) => selectedIds.includes(item.id)).slice(0, COMPARE_LIMIT),
    [favorites, selectedIds],
  );

  function toggleCompare(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= COMPARE_LIMIT) {
        return [...current.slice(1), id];
      }
      return [...current, id];
    });
  }

  function removeFavorite(id: string) {
    const next = removeFavoriteInstitution(id);
    setFavorites(next);
    setSelectedIds((current) => current.filter((item) => item !== id));
  }

  function clearFavorites() {
    writeFavoriteInstitutions([]);
    setFavorites([]);
    setSelectedIds([]);
  }

  function goToSearch(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const cityId = getLastSearchCityId();
    window.location.assign(
      cityId ? `/search?city=${encodeURIComponent(cityId)}` : "/search",
    );
  }

  const greeting = displayName?.trim() || email;
  const showEmptyFavorites = mounted && favorites.length === 0;

  return (
    <div className={cn("ea-parent-profile", className)}>
      <Container size="xl" className="ea-parent-profile__inner">
        <header className="ea-parent-profile__hero">
          <p className="ea-marketing-eyebrow">Veli profili</p>
          <h1 className="ea-parent-profile__title">Merhaba, {greeting}</h1>
          <p className="ea-parent-profile__lede">
            Favori kurumlarınızı inceleyin ve yan yana kıyaslayın. Liste bu cihazda saklanır.
          </p>
          <div className="ea-parent-profile__hero-actions">
            <a
              href="/search"
              className={getButtonClassName({ variant: "primary", size: "md" })}
              onClick={goToSearch}
            >
              Kurum ara
            </a>
            {logoutAction ? <LogoutButton action={logoutAction} /> : null}
          </div>
        </header>

        <section className="ea-parent-profile__section" aria-labelledby="parent-favorites-heading">
          <div className="ea-parent-profile__section-head">
            <div>
              <h2 id="parent-favorites-heading" className="ea-parent-profile__section-title">
                Favori kurumlarım
              </h2>
              <p className="ea-parent-profile__section-copy">
                {!mounted
                  ? "Favoriler yükleniyor…"
                  : favorites.length === 0
                    ? "Henüz favori eklemediniz. Arama sonuçlarından kalp ile ekleyebilirsiniz."
                    : `${favorites.length} kurum favorilerinizde.`}
              </p>
            </div>
            {favorites.length > 0 ? (
              <button type="button" className="ea-parent-profile__text-action" onClick={clearFavorites}>
                Tümünü temizle
              </button>
            ) : null}
          </div>

          {showEmptyFavorites ? (
            <div className="ea-parent-profile__empty">
              <p>Favori listeniz boş.</p>
              <a
                href="/search"
                className={getButtonClassName({ variant: "secondary", size: "sm" })}
                onClick={goToSearch}
              >
                Keşfe başla
              </a>
            </div>
          ) : (
            <ul className="ea-parent-profile__favorites">
              {favorites.map((institution) => {
                const selected = selectedIds.includes(institution.id);
                return (
                  <li key={institution.id} className="ea-parent-profile__favorite-item">
                    <InstitutionCard
                      data={institution}
                      layout="horizontal"
                      actions={{ showFavorite: false, showCompare: false, showCta: true }}
                    />
                    <div className="ea-parent-profile__favorite-tools">
                      <button
                        type="button"
                        className={cn(
                          "ea-parent-profile__chip",
                          selected && "ea-parent-profile__chip--active",
                        )}
                        aria-pressed={selected}
                        onClick={() => toggleCompare(institution.id)}
                      >
                        {selected ? "Kıyastan çıkar" : "Kıyasa ekle"}
                      </button>
                      <button
                        type="button"
                        className="ea-parent-profile__chip ea-parent-profile__chip--danger"
                        onClick={() => removeFavorite(institution.id)}
                      >
                        Favoriden çıkar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="ea-parent-profile__section" aria-labelledby="parent-compare-heading">
          <div className="ea-parent-profile__section-head">
            <div>
              <h2 id="parent-compare-heading" className="ea-parent-profile__section-title">
                Favorileri kıyasla
              </h2>
              <p className="ea-parent-profile__section-copy">
                En fazla {COMPARE_LIMIT} kurumu seçerek tür, konum ve puan bilgilerini yan yana görün.
              </p>
            </div>
          </div>

          {compareItems.length < 2 ? (
            <div className="ea-parent-profile__empty">
              <p>Kıyas için favorilerinizden en az 2 kurum seçin.</p>
            </div>
          ) : (
            <div className="ea-parent-profile__compare" role="table" aria-label="Kurum kıyası">
              <div className="ea-parent-profile__compare-row" role="row">
                <div className="ea-parent-profile__compare-label" role="rowheader">
                  Kurum
                </div>
                {compareItems.map((item) => (
                  <div key={item.id} className="ea-parent-profile__compare-cell" role="cell">
                    <a href={item.href}>{item.name}</a>
                  </div>
                ))}
              </div>
              <div className="ea-parent-profile__compare-row" role="row">
                <div className="ea-parent-profile__compare-label" role="rowheader">
                  Tür
                </div>
                {compareItems.map((item) => (
                  <div key={item.id} className="ea-parent-profile__compare-cell" role="cell">
                    {item.typeLabel}
                  </div>
                ))}
              </div>
              <div className="ea-parent-profile__compare-row" role="row">
                <div className="ea-parent-profile__compare-label" role="rowheader">
                  Konum
                </div>
                {compareItems.map((item) => (
                  <div key={item.id} className="ea-parent-profile__compare-cell" role="cell">
                    {[item.district, item.city].filter(Boolean).join(", ") || "—"}
                  </div>
                ))}
              </div>
              <div className="ea-parent-profile__compare-row" role="row">
                <div className="ea-parent-profile__compare-label" role="rowheader">
                  Puan
                </div>
                {compareItems.map((item) => (
                  <div key={item.id} className="ea-parent-profile__compare-cell" role="cell">
                    {item.ratingPlaceholder ?? "—"}
                  </div>
                ))}
              </div>
              <div className="ea-parent-profile__compare-row" role="row">
                <div className="ea-parent-profile__compare-label" role="rowheader">
                  Programlar
                </div>
                {compareItems.map((item) => (
                  <div key={item.id} className="ea-parent-profile__compare-cell" role="cell">
                    {item.programLabels?.length ? item.programLabels.join(", ") : "—"}
                  </div>
                ))}
              </div>
              <div className="ea-parent-profile__compare-row" role="row">
                <div className="ea-parent-profile__compare-label" role="rowheader">
                  Güven
                </div>
                {compareItems.map((item) => (
                  <div key={item.id} className="ea-parent-profile__compare-cell" role="cell">
                    {[
                      item.badges?.verified ? "Doğrulanmış" : null,
                      item.badges?.premium ? "Premium" : null,
                      item.badges?.featured ? "Öne çıkan" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </Container>
    </div>
  );
}
