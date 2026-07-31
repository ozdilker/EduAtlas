"use client";

import { Container } from "../components/container";
import { cn } from "../lib/cn";
import { SearchBar } from "../search/search-bar";
import type { SearchActiveFiltersView } from "./build-search-href";

export type SearchResultsHeaderProps = {
  title?: string;
  description?: string;
  defaultQuery?: string;
  /** Preserve active filters when submitting a new keyword search. */
  preserveFilters?: SearchActiveFiltersView & { sort?: string };
  className?: string;
};

/**
 * Search results page header with GET form search bar.
 */
export function SearchResultsHeader({
  title,
  description = "Türkiye genelinde eğitim kurumlarını keşfedin — güvenle karşılaştırın.",
  defaultQuery = "",
  preserveFilters,
  className,
}: SearchResultsHeaderProps) {
  const trimmed = defaultQuery.trim();
  const resolvedTitle = title ?? (trimmed ? `“${trimmed}” için arama sonuçları` : "Kurum ara");

  const hiddenFields = (
    <>
      {preserveFilters?.cityId ? (
        <input type="hidden" name="city" value={preserveFilters.cityId} />
      ) : null}
      {preserveFilters?.districtId ? (
        <input type="hidden" name="district" value={preserveFilters.districtId} />
      ) : null}
      {preserveFilters?.type ? (
        <input type="hidden" name="type" value={preserveFilters.type} />
      ) : null}
      {preserveFilters?.verified ? <input type="hidden" name="verified" value="1" /> : null}
      {preserveFilters?.premium ? <input type="hidden" name="premium" value="1" /> : null}
      {preserveFilters?.sort && preserveFilters.sort !== "relevance" ? (
        <input type="hidden" name="sort" value={preserveFilters.sort} />
      ) : null}
    </>
  );

  return (
    <header className={cn("ea-search-results__header", className)}>
      <Container size="xl">
        <div className="ea-search-results__header-inner">
          <div className="ea-search-results__intro">
            <p className="ea-marketing-eyebrow">Keşif</p>
            <h1 className="ea-search-results__title">{resolvedTitle}</h1>
            <p className="ea-search-results__description">{description}</p>
          </div>
          <SearchBar
            variant="page"
            defaultQuery={defaultQuery}
            action="/search"
            method="get"
            inputName="q"
            className="ea-search-results__bar"
            filtersSlot={preserveFilters ? hiddenFields : null}
          />
        </div>
      </Container>
    </header>
  );
}
