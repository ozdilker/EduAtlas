"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { getButtonClassName } from "../components/button-classes";
import { Container } from "../components/container";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import { getHomePopularCities, getHomePopularSearches, getHomeTrustBar } from "./home-content";

const DEFAULT_HOME_HERO_IMAGE_URL = "/images/home-hero.png";

export type HomeHeroCityOption = {
  /** Search filter city id submitted as `city` (e.g. city_istanbul). */
  id: string;
  /** Public slug used for hero city imagery (e.g. istanbul). */
  slug: string;
  label: string;
};

const FALLBACK_HOME_CITIES: readonly HomeHeroCityOption[] = Object.freeze(
  getHomePopularCities().map((city) => ({
    id: city.id,
    slug: city.id,
    label: city.label,
  })),
);

export type HomeHeroProps = {
  appName?: string;
  /** Full-bleed default hero background URL. */
  heroImageUrl?: string;
  /** Per-city hero images keyed by city slug. */
  cityImageUrls?: Readonly<Partial<Record<string, string>>>;
  /** Alphabetical city options for the search location dropdown. */
  cities?: readonly HomeHeroCityOption[];
  className?: string;
};

function TrustStatIcon({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };

  switch (id) {
    case "institutions":
      return (
        <svg {...common}>
          <path
            d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6M10 10h4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "families":
      return (
        <svg {...common}>
          <path
            d="M22 10 12 5 2 10l10 5 10-5z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 12v5c1.5 1.8 4 2.8 6 2.8s4.5-1 6-2.8v-5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 10v6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cities":
      return (
        <svg {...common}>
          <path
            d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "rating":
      return (
        <svg {...common}>
          <path
            d="M12 3.5l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.9l-4.8 2.52.92-5.34-3.88-3.78 5.36-.78L12 3.5z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Homepage hero — city dropdown swaps background to that city's image asynchronously.
 */
export function HomeHero({
  appName = "EduAtlas",
  heroImageUrl = DEFAULT_HOME_HERO_IMAGE_URL,
  cityImageUrls,
  cities: citiesProp = [],
  className,
}: HomeHeroProps) {
  const popular = getHomePopularSearches();
  const stats = getHomeTrustBar();
  const cities = citiesProp.length > 0 ? citiesProp : FALLBACK_HOME_CITIES;
  const citySelectId = useId();
  const [selectedCityId, setSelectedCityId] = useState("");
  const [activeHeroUrl, setActiveHeroUrl] = useState(heroImageUrl);
  const [, startTransition] = useTransition();

  function resolveUrlForCityId(cityId: string): string {
    if (!cityId) {
      return heroImageUrl;
    }
    const match = cities.find((city) => city.id === cityId);
    const slug = match?.slug ?? cityId.replace(/^city_/i, "");
    const normalizedId = cityId.replace(/^city_/i, "");
    const cityUrl =
      cityImageUrls?.[slug]?.trim() ||
      cityImageUrls?.[cityId]?.trim() ||
      cityImageUrls?.[normalizedId]?.trim();
    return cityUrl && cityUrl.length > 0 ? cityUrl : heroImageUrl;
  }

  useEffect(() => {
    setActiveHeroUrl(resolveUrlForCityId(selectedCityId));
  }, [heroImageUrl, cityImageUrls, selectedCityId, cities]);

  function onCityChange(cityId: string) {
    setSelectedCityId(cityId);
    const nextUrl = resolveUrlForCityId(cityId);
    startTransition(() => {
      void preloadImage(nextUrl).then(() => {
        setActiveHeroUrl(nextUrl);
      });
    });
  }

  return (
    <section className={cn("ea-home-hero", className)} aria-labelledby="home-hero-heading">
      <div
        className="ea-home-hero__skyline"
        aria-hidden="true"
        style={{ ["--ea-home-hero-image" as string]: `url("${activeHeroUrl}")` }}
      />
      <Container size="xl" className="ea-home-hero__container">
        <div className="ea-home-hero__content">
          <p className="ea-home-hero__eyebrow">{appName}</p>
          <h1 id="home-hero-heading" className="ea-home-hero__title">
            Türkiye’nin en kapsamlı eğitim atlası
          </h1>
          <p className="ea-home-hero__subtitle">
            Aileler güvenle karar verir. Kurumlar doğru öğrencilere ulaşır. Keşfedin, karşılaştırın,
            iletişime geçin.
          </p>

          <search className="ea-home-hero__search" aria-label="Kurum arama">
            <form className="ea-home-hero__search-form" action="/search" method="get">
              <label className="ea-sr-only" htmlFor="home-search-input">
                Kurum, şehir veya tür ara
              </label>
              <Input
                id="home-search-input"
                name="q"
                type="search"
                placeholder="Kurum, kurs veya anahtar kelime…"
                autoComplete="off"
                spellCheck={false}
                className="ea-home-hero__search-input"
              />
              <label className="ea-sr-only" htmlFor={citySelectId}>
                Şehir seç
              </label>
              <select
                id={citySelectId}
                name="city"
                className="ea-home-hero__city-select"
                value={selectedCityId}
                onChange={(event) => onCityChange(event.target.value)}
              >
                <option value="">Tüm şehirler</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className={cn(
                  getButtonClassName({ variant: "primary", size: "lg" }),
                  "ea-home-hero__search-button",
                )}
              >
                Ara
              </button>
            </form>
          </search>

          <ul className="ea-home-hero__popular" aria-label="Popüler aramalar">
            {popular.map((item) => (
              <li key={item.id}>
                <a href={item.href} className="ea-home-hero__popular-chip">
                  <span className="ea-home-hero__popular-icon" aria-hidden="true" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <section className="ea-home-hero__stats" aria-label="EduAtlas göstergeleri">
          <ul className="ea-home-hero__stats-list">
            {stats.map((item) => (
              <li key={item.id} className="ea-home-hero__stats-item">
                <span className="ea-home-hero__stats-icon" aria-hidden="true">
                  <TrustStatIcon id={item.id} />
                </span>
                <div>
                  <p className="ea-home-hero__stats-value">{item.value}</p>
                  <p className="ea-home-hero__stats-label">{item.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </section>
  );
}
