"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import { Button } from "../components/button";
import { getLastSearchCityId, setLastSearchCityId } from "../parent/parent-search-location-storage";
import { findNearestCityId } from "../parent/turkey-city-centroids";
import { buildSearchHref, type SearchFiltersViewModel } from "./build-search-href";

export type SearchLocationGateProps = {
  query: string;
  filters?: SearchFiltersViewModel;
  className?: string;
};

type GateStatus = "idle" | "redirecting" | "locating" | "denied" | "unavailable" | "timeout";

const GEOLOCATION_TIMEOUT_MS = 4000;

function readBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(Object.assign(new Error("geolocation_unavailable"), { code: 0 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

function navigateToScopedSearch(query: string, cityId: string, filters?: SearchFiltersViewModel) {
  const href = buildSearchHref({
    q: query,
    city: cityId,
    district: filters?.active.districtId,
    type: filters?.active.type,
    verified: filters?.active.verified,
    premium: filters?.active.premium,
    sort: filters?.sort,
    page: 1,
  });
  window.location.assign(href);
}

/**
 * City-scope gate for public free-text search — never runs unscoped /search?q=.
 * Reuses last-search city, optional GPS → findNearestCityId, or manual city select.
 */
export function SearchLocationGate({ query, filters, className }: SearchLocationGateProps) {
  const selectId = useId();
  const cities = filters?.cities ?? [];
  const [status, setStatus] = useState<GateStatus>("idle");
  const [selectedCityId, setSelectedCityId] = useState("");

  useEffect(() => {
    const stored = getLastSearchCityId();
    if (!stored) {
      return;
    }
    const known = cities.length === 0 || cities.some((city) => city.id === stored);
    if (!known) {
      return;
    }
    setStatus("redirecting");
    setLastSearchCityId(stored);
    navigateToScopedSearch(query, stored, filters);
  }, [cities, filters, query]);

  async function onUseLocation() {
    setStatus("locating");
    try {
      const position = await readBrowserPosition();
      const cityId = findNearestCityId(position.coords.latitude, position.coords.longitude);
      if (!cityId) {
        setStatus("unavailable");
        return;
      }
      setLastSearchCityId(cityId);
      setStatus("redirecting");
      navigateToScopedSearch(query, cityId, filters);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? Number((error as { code?: unknown }).code)
          : undefined;
      if (code === 1) {
        setStatus("denied");
      } else if (code === 3) {
        setStatus("timeout");
      } else {
        setStatus("unavailable");
      }
    }
  }

  function onManualCitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cityId = selectedCityId.trim();
    if (!cityId) {
      return;
    }
    setLastSearchCityId(cityId);
    setStatus("redirecting");
    navigateToScopedSearch(query, cityId, filters);
  }

  const statusMessage =
    status === "locating"
      ? "Konumunuz alınıyor…"
      : status === "redirecting"
        ? "Şehrinizle arama açılıyor…"
        : status === "denied"
          ? "Konum izni verilmedi. Lütfen şehrinizi seçin."
          : status === "timeout"
            ? "Konum zaman aşımına uğradı. Lütfen şehrinizi seçin."
            : status === "unavailable"
              ? "Konum kullanılamıyor. Lütfen şehrinizi seçin."
              : null;

  return (
    <section
      className={className ? `ea-search-location-gate ${className}` : "ea-search-location-gate"}
      aria-labelledby="search-location-gate-title"
    >
      <h2 id="search-location-gate-title" className="ea-search-location-gate__title">
        Yakınınızdaki eğitim kurumlarını bulalım
      </h2>
      <p className="ea-search-location-gate__lede">
        “{query}” araması için önce bir şehir seçmeniz gerekiyor. Konumunuzu kullanabilir veya şehri
        elle seçebilirsiniz.
      </p>

      <div className="ea-search-location-gate__actions">
        <Button
          type="button"
          variant="primary"
          onClick={() => void onUseLocation()}
          disabled={status === "locating" || status === "redirecting"}
        >
          Konumumu Kullan
        </Button>
      </div>

      <p className="ea-search-location-gate__divider">veya şehrinizi seçin</p>

      <form className="ea-search-location-gate__form" onSubmit={onManualCitySubmit}>
        <label className="ea-sr-only" htmlFor={selectId}>
          Şehir seç
        </label>
        <select
          id={selectId}
          className="ea-search-location-gate__select"
          name="city"
          value={selectedCityId}
          disabled={status === "redirecting"}
          onChange={(event) => setSelectedCityId(event.target.value)}
          required
        >
          <option value="">Şehir seçin</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.label}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          variant="secondary"
          disabled={!selectedCityId || status === "redirecting"}
        >
          Bu şehirde ara
        </Button>
      </form>

      {statusMessage ? (
        <p className="ea-search-location-gate__status" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
    </section>
  );
}
