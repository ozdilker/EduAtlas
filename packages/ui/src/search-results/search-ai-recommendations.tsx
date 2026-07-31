"use client";

import { useEffect, useMemo, useState } from "react";
import { InstitutionCard } from "../institution/institution-card";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { cn } from "../lib/cn";
import {
  FAVORITES_STORAGE_KEY,
  readFavoriteInstitutions,
} from "../parent/parent-favorites-storage";
import type { SearchFiltersViewModel } from "./build-search-href";

const MIN_FAVORITES = 5;

export type SearchAiRecommendationsProps = {
  /** Only registered parents should enable AI recommendations. */
  enabled?: boolean;
  /** Current search filters — recommendations stay aligned with this context. */
  filters?: SearchFiltersViewModel;
  className?: string;
};

type AiResponse = {
  profile?: { summary?: string };
  institutions?: InstitutionCardViewData[];
  error?: string;
};

/**
 * Personalized AI recommendations — visible only for logged-in parents with 5+ favorites.
 * Ranking uses favorites + the active search query/filters.
 */
export function SearchAiRecommendations({
  enabled = false,
  filters,
  className,
}: SearchAiRecommendationsProps) {
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionCardViewData[]>([]);

  const searchContext = useMemo(() => {
    if (!filters) {
      return undefined;
    }
    const cityLabel = filters.cities.find((item) => item.id === filters.active.cityId)?.label;
    const districtLabel = filters.districts.find(
      (item) => item.id === filters.active.districtId,
    )?.label;
    const typeLabel = filters.types.find((item) => item.id === filters.active.type)?.label;

    return {
      query: filters.query,
      cityId: filters.active.cityId,
      districtId: filters.active.districtId,
      type: filters.active.type,
      verified: filters.active.verified,
      premium: filters.active.premium,
      cityLabel,
      districtLabel,
      typeLabel,
    };
  }, [filters]);

  const searchKey = useMemo(
    () =>
      JSON.stringify({
        q: searchContext?.query ?? "",
        city: searchContext?.cityId ?? "",
        district: searchContext?.districtId ?? "",
        type: searchContext?.type ?? "",
        verified: Boolean(searchContext?.verified),
        premium: Boolean(searchContext?.premium),
      }),
    [searchContext],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function syncCount() {
      setFavoriteCount(readFavoriteInstitutions().length);
    }

    syncCount();
    window.addEventListener("storage", syncCount);
    window.addEventListener("eduatlas:favorites-changed", syncCount);
    return () => {
      window.removeEventListener("storage", syncCount);
      window.removeEventListener("eduatlas:favorites-changed", syncCount);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || favoriteCount < MIN_FAVORITES) {
      setInstitutions([]);
      setSummary(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const favorites = readFavoriteInstitutions().slice(0, 20);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/parent/ai-recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorites, search: searchContext }),
        });
        const data = (await response.json()) as AiResponse;
        if (cancelled) return;
        if (!response.ok) {
          setError(data.error ?? "Öneriler yüklenemedi.");
          setInstitutions([]);
          return;
        }
        setSummary(data.profile?.summary ?? null);
        setInstitutions(Array.isArray(data.institutions) ? data.institutions.slice(0, 3) : []);
      } catch {
        if (!cancelled) {
          setError("Öneriler yüklenirken bir sorun oluştu.");
          setInstitutions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, favoriteCount, searchKey]);

  if (!enabled) {
    return null;
  }

  if (favoriteCount < MIN_FAVORITES) {
    return (
      <section
        className={cn("ea-search-results__recommend ea-search-results__recommend--locked", className)}
        aria-labelledby="search-ai-locked-heading"
      >
        <header className="ea-search-results__recommend-header">
          <div>
            <p className="ea-search-results__recommend-eyebrow">Yapay zeka önerileri</p>
            <h2 id="search-ai-locked-heading" className="ea-search-results__recommend-title">
              Favorilerinizi analiz edelim
            </h2>
            <p className="ea-search-results__recommend-copy">
              Kişisel öneriler için en az {MIN_FAVORITES} kurumu favoriye alın. Şu an {favoriteCount}/
              {MIN_FAVORITES} favoriniz var. Favorilerdeki kurum türü, şehir ve güven işaretleri
              veli profilinizi belirlemek için kullanılır.
            </p>
          </div>
          <span className="ea-search-results__recommend-badge">
            {favoriteCount}/{MIN_FAVORITES}
          </span>
        </header>
      </section>
    );
  }

  if (loading) {
    return (
      <section
        className={cn("ea-search-results__recommend", className)}
        aria-busy="true"
        aria-labelledby="search-ai-loading-heading"
      >
        <header className="ea-search-results__recommend-header">
          <div>
            <p className="ea-search-results__recommend-eyebrow">Yapay zeka önerileri</p>
            <h2 id="search-ai-loading-heading" className="ea-search-results__recommend-title">
              Aramanıza göre öneriler hazırlanıyor…
            </h2>
            <p className="ea-search-results__recommend-copy">
              Favorileriniz ve aktif arama filtreleriniz birlikte değerlendiriliyor.
            </p>
          </div>
          <span className="ea-search-results__recommend-badge">AI</span>
        </header>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={cn("ea-search-results__recommend", className)}
        aria-labelledby="search-ai-error-heading"
      >
        <header className="ea-search-results__recommend-header">
          <div>
            <p className="ea-search-results__recommend-eyebrow">Yapay zeka önerileri</p>
            <h2 id="search-ai-error-heading" className="ea-search-results__recommend-title">
              Öneriler hazırlanamadı
            </h2>
            <p className="ea-search-results__recommend-copy">{error}</p>
          </div>
        </header>
      </section>
    );
  }

  if (institutions.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("ea-search-results__recommend", className)}
      aria-labelledby="search-recommendations-heading"
      data-favorites-key={FAVORITES_STORAGE_KEY}
    >
      <header className="ea-search-results__recommend-header">
        <div>
          <p className="ea-search-results__recommend-eyebrow">AI ile size özel öneriler</p>
          <h2 id="search-recommendations-heading" className="ea-search-results__recommend-title">
            Size en uygun {institutions.length} kurum önerisi
          </h2>
          {summary ? (
            <p className="ea-search-results__recommend-copy">{summary}</p>
          ) : (
            <p className="ea-search-results__recommend-copy">
              Favorileriniz ve mevcut aramanız birlikte analiz edilerek önerildi.
            </p>
          )}
          <p className="ea-search-results__recommend-why">
            Neden öneriyoruz? Aktif arama filtreleriniz ile favori tercihlerinizin örtüşmesi.
          </p>
        </div>
      </header>

      <ul className="ea-search-results__recommend-list">
        {institutions.map((institution) => (
          <li key={institution.id} className="ea-search-results__recommend-item">
            <InstitutionCard
              data={institution}
              layout="vertical"
              mediaPlacement="background"
              actions={{ showFavorite: true, showCta: true }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
