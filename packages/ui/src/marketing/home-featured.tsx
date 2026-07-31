"use client";

import { useEffect, useState } from "react";
import { Container } from "../components/container";
import { InstitutionCard } from "../institution/institution-card";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";
import {
  SEARCH_LOCATION_CHANGED_EVENT,
  getLastSearchCityId,
} from "../parent/parent-search-location-storage";
import { resolveHomeFeaturedLocation } from "../parent/resolve-home-featured-location";

export type HomeFeaturedProps = {
  institutions?: readonly InstitutionCardViewData[];
  className?: string;
};

type FeaturedApiResponse = {
  cityId?: string | null;
  institutions?: InstitutionCardViewData[];
};

function cityLabelFromCards(
  cityId: string | null,
  cards: readonly InstitutionCardViewData[],
): string | null {
  if (!cityId) return null;
  const fromCard = cards.find((item) => item.city)?.city;
  return fromCard ?? null;
}

/**
 * Featured institution strip on the homepage — location-aware + completeness ranked.
 */
export function HomeFeatured({ institutions = [], className }: HomeFeaturedProps) {
  const [items, setItems] = useState<readonly InstitutionCardViewData[]>(institutions);
  const [cityId, setCityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(institutions);
  }, [institutions]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadForLocation() {
      setLoading(true);
      try {
        const location = await resolveHomeFeaturedLocation();
        if (cancelled) return;

        const params = new URLSearchParams();
        if (location.cityId) {
          params.set("cityId", location.cityId);
        }
        const response = await fetch(`/api/home/featured?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("featured_failed");
        }
        const data = (await response.json()) as FeaturedApiResponse;
        if (cancelled) return;

        const next = Array.isArray(data.institutions) ? data.institutions : [];
        setCityId(data.cityId ?? location.cityId);
        setItems(next);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        // Keep SSR institutions on failure.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadForLocation();

    function onLocationChanged() {
      const nextCity = getLastSearchCityId();
      setCityId(nextCity);
      void (async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (nextCity) {
            params.set("cityId", nextCity);
          }
          const response = await fetch(`/api/home/featured?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error("featured_failed");
          }
          const data = (await response.json()) as FeaturedApiResponse;
          if (cancelled) return;
          setItems(Array.isArray(data.institutions) ? data.institutions : []);
          setCityId(data.cityId ?? nextCity);
        } catch {
          // keep current
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    }

    window.addEventListener(SEARCH_LOCATION_CHANGED_EVENT, onLocationChanged);
    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener(SEARCH_LOCATION_CHANGED_EVENT, onLocationChanged);
    };
  }, []);

  const locationLabel = cityLabelFromCards(cityId, items);
  const lede = locationLabel
    ? `${locationLabel} çevresinde profili en güçlü yayınlı kurumlardan bir seçki.`
    : "Profil tamamlanma oranına göre öne çıkan yayınlı kurumlar — konum seçerek daraltabilirsiniz.";

  if (items.length === 0) {
    return (
      <section className={cn("ea-home-featured", className)} aria-labelledby="home-featured-heading">
        <Container size="xl">
          <header className="ea-home-section-header">
            <p className="ea-marketing-eyebrow">Keşfet</p>
            <h2 id="home-featured-heading" className="ea-home-section-title">
              Yayınlı kurumlar
            </h2>
            <p className="ea-home-section-lede">
              {loading
                ? "Konumunuza göre kurumlar yükleniyor…"
                : "Henüz öne çıkarılacak yayınlı kurum yok. Arama sayfasından keşfe devam edin."}
            </p>
          </header>
          <p className="ea-home-featured__more">
            <a href="/search">Arama sayfasına git</a>
          </p>
        </Container>
      </section>
    );
  }

  return (
    <section className={cn("ea-home-featured", className)} aria-labelledby="home-featured-heading">
      <Container size="xl">
        <header className="ea-home-section-header">
          <p className="ea-marketing-eyebrow">Keşfet</p>
          <h2 id="home-featured-heading" className="ea-home-section-title">
            Öne çıkan kurumlar
          </h2>
          <p className="ea-home-section-lede" aria-live="polite">
            {loading ? "Konumunuza göre güncelleniyor…" : lede}
          </p>
        </header>

        <ul className="ea-home-featured__grid">
          {items.map((institution) => (
            <li key={institution.id}>
              <InstitutionCard
                data={institution}
                layout="vertical"
                actions={{ showFavorite: true, showCta: true }}
              />
            </li>
          ))}
        </ul>

        <p className="ea-home-featured__more">
          <a href={cityId ? `/search?city=${encodeURIComponent(cityId)}` : "/search"}>
            Tüm arama sonuçlarını gör
          </a>
        </p>
      </Container>
    </section>
  );
}
