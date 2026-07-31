"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "../components/button";
import { getButtonClassName } from "../components/button-classes";
import { cn } from "../lib/cn";
import {
  buildSearchHref,
  type SearchFilterOption,
  type SearchFiltersViewModel,
  toSearchHrefParams,
} from "./build-search-href";

export type SearchResultsSidebarProps = {
  filters?: SearchFiltersViewModel;
  className?: string;
};

type DistrictsApiResponse = {
  cityId?: string | null;
  districts?: SearchFilterOption[];
};

/**
 * Functional search filters sidebar — GET form wired to `/search` query params.
 * Districts load asynchronously after a city is selected.
 */
export function SearchResultsSidebar({ filters, className }: SearchResultsSidebarProps) {
  const [selectedCityId, setSelectedCityId] = useState(filters?.active.cityId ?? "");
  const [selectedDistrictId, setSelectedDistrictId] = useState(filters?.active.districtId ?? "");
  const [districtOptions, setDistrictOptions] = useState<readonly SearchFilterOption[]>(
    filters?.districts ?? [],
  );
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setSelectedCityId(filters?.active.cityId ?? "");
    setSelectedDistrictId(filters?.active.districtId ?? "");
    setDistrictOptions(filters?.districts ?? []);
  }, [filters?.active.cityId, filters?.active.districtId, filters?.districts]);

  useEffect(() => {
    if (!selectedCityId) {
      setDistrictOptions([]);
      setDistrictsLoading(false);
      return;
    }

    // Keep SSR districts while the selected city still matches the server filters.
    if (
      selectedCityId === (filters?.active.cityId ?? "") &&
      (filters?.districts?.length ?? 0) > 0
    ) {
      setDistrictOptions(filters?.districts ?? []);
      setDistrictsLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function loadDistricts() {
      setDistrictsLoading(true);
      try {
        const response = await fetch(
          `/api/search/districts?city=${encodeURIComponent(selectedCityId)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("districts_failed");
        }
        const data = (await response.json()) as DistrictsApiResponse;
        if (cancelled) {
          return;
        }
        const next = Array.isArray(data.districts) ? data.districts : [];
        startTransition(() => {
          setDistrictOptions(next);
          setSelectedDistrictId((current) =>
            next.some((item) => item.id === current) ? current : "",
          );
        });
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        setDistrictOptions([]);
        setSelectedDistrictId("");
      } finally {
        if (!cancelled) {
          setDistrictsLoading(false);
        }
      }
    }

    void loadDistricts();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedCityId, filters?.active.cityId, filters?.districts]);

  if (!filters) {
    return (
      <aside
        className={cn("ea-search-results__sidebar", className)}
        aria-labelledby="search-filters-heading"
      >
        <h2 id="search-filters-heading" className="ea-search-results__sidebar-title">
          Filtreler
        </h2>
        <p className="ea-search-results__sidebar-note">Filtreler yükleniyor…</p>
      </aside>
    );
  }

  const { active, cities, types, query, sort } = filters;
  const clearHref = buildSearchHref({ q: query, sort });
  const activeCount = [
    active.cityId,
    active.districtId,
    active.type,
    active.verified,
    active.premium,
  ].filter(Boolean).length;

  return (
    <aside
      className={cn("ea-search-results__sidebar", className)}
      aria-labelledby="search-filters-heading"
    >
      <div className="ea-search-results__sidebar-top">
        <h2 id="search-filters-heading" className="ea-search-results__sidebar-title">
          Filtreler
        </h2>
        {activeCount > 0 ? (
          <a href={clearHref} className="ea-search-results__sidebar-clear">
            Temizle ({activeCount})
          </a>
        ) : null}
      </div>
      <p className="ea-search-results__sidebar-note">
        Şehir, ilçe, kurum türü ve güven işaretleriyle sonuçları daraltın.
      </p>

      <form className="ea-search-results__filter-form" action="/search" method="get">
        {query ? <input type="hidden" name="q" value={query} /> : null}
        {sort && sort !== "relevance" ? <input type="hidden" name="sort" value={sort} /> : null}

        <fieldset className="ea-search-results__filter-group">
          <legend className="ea-search-results__filter-legend">Şehir</legend>
          <select
            className="ea-search-results__filter-select"
            name="city"
            value={selectedCityId}
            aria-label="Şehir filtresi"
            onChange={(event) => {
              const nextCity = event.target.value;
              setSelectedCityId(nextCity);
              setSelectedDistrictId("");
              if (!nextCity) {
                setDistrictOptions([]);
              }
            }}
          >
            <option value="">Tüm şehirler</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="ea-search-results__filter-group">
          <legend className="ea-search-results__filter-legend">İlçe</legend>
          <select
            className="ea-search-results__filter-select"
            name="district"
            value={selectedDistrictId}
            disabled={!selectedCityId || districtsLoading}
            aria-label="İlçe filtresi"
            aria-busy={districtsLoading || undefined}
            onChange={(event) => setSelectedDistrictId(event.target.value)}
          >
            <option value="">
              {!selectedCityId
                ? "Önce şehir seçin"
                : districtsLoading
                  ? "İlçeler yükleniyor…"
                  : "Tüm ilçeler"}
            </option>
            {districtOptions.map((district) => (
              <option key={district.id} value={district.id}>
                {district.label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="ea-search-results__filter-group">
          <legend className="ea-search-results__filter-legend">Kurum türü</legend>
          <ul className="ea-search-results__filter-list" aria-label="Kurum türleri">
            <li>
              <a
                href={buildSearchHref(toSearchHrefParams(filters, { type: null, page: 1 }))}
                className={getButtonClassName({
                  variant: !active.type ? "secondary" : "tertiary",
                  size: "sm",
                  className: "ea-search-results__filter-chip",
                })}
                aria-current={!active.type ? "true" : undefined}
              >
                Tümü
              </a>
            </li>
            {types.map((type) => {
              const selected = active.type === type.id;
              return (
                <li key={type.id}>
                  <a
                    href={buildSearchHref(
                      toSearchHrefParams(filters, {
                        type: selected ? null : type.id,
                        page: 1,
                      }),
                    )}
                    className={getButtonClassName({
                      variant: selected ? "secondary" : "tertiary",
                      size: "sm",
                      className: "ea-search-results__filter-chip",
                    })}
                    aria-current={selected ? "true" : undefined}
                  >
                    {type.label}
                  </a>
                </li>
              );
            })}
          </ul>
          {active.type ? <input type="hidden" name="type" value={active.type} /> : null}
        </fieldset>

        <fieldset className="ea-search-results__filter-group">
          <legend className="ea-search-results__filter-legend">Güven ve üyelik</legend>
          <label className="ea-search-results__filter-check">
            <input type="checkbox" name="verified" value="1" defaultChecked={Boolean(active.verified)} />
            <span>Yalnızca doğrulanmış</span>
          </label>
          <label className="ea-search-results__filter-check">
            <input type="checkbox" name="premium" value="1" defaultChecked={Boolean(active.premium)} />
            <span>Premium kurumlar</span>
          </label>
        </fieldset>

        <div className="ea-search-results__filter-actions">
          <Button type="submit" variant="primary" size="sm">
            Filtreleri uygula
          </Button>
        </div>
      </form>
    </aside>
  );
}
