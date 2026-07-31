import { getButtonClassName } from "../components/button-classes";
import { cn } from "../lib/cn";
import {
  buildSearchHref,
  type SearchFiltersViewModel,
  toSearchHrefParams,
} from "./build-search-href";
import {
  getStaticSearchResultsSortOptions,
  getStaticSearchResultsSummary,
  type SearchResultsSortOption,
} from "./search-results-content";

export type SearchResultsSummaryProps = {
  resultCountLabel?: string;
  queryLabel?: string;
  sortOptions?: SearchResultsSortOption[];
  filters?: SearchFiltersViewModel;
  className?: string;
};

/**
 * Results count + functional sort controls linked to `/search` query params.
 */
export function SearchResultsSummary({
  resultCountLabel,
  queryLabel,
  sortOptions = getStaticSearchResultsSortOptions(),
  filters,
  className,
}: SearchResultsSummaryProps) {
  const summary = getStaticSearchResultsSummary();
  const countLabel = resultCountLabel ?? summary.resultCountLabel;
  const query = queryLabel ?? summary.queryLabel;

  const resolvedSortOptions =
    filters != null
      ? [
          {
            id: "relevance",
            label: "İlgiye göre",
            selected: !filters.sort || filters.sort === "relevance",
            href: buildSearchHref(toSearchHrefParams(filters, { sort: "relevance", page: 1 })),
          },
          {
            id: "name",
            label: "Ada göre (A-Z)",
            selected: filters.sort === "name",
            href: buildSearchHref(toSearchHrefParams(filters, { sort: "name", page: 1 })),
          },
          {
            id: "name_desc",
            label: "Ada göre (Z-A)",
            selected: filters.sort === "name_desc",
            href: buildSearchHref(toSearchHrefParams(filters, { sort: "name_desc", page: 1 })),
          },
        ]
      : sortOptions.map((option) => ({ ...option, href: undefined as string | undefined }));

  return (
    <div className={cn("ea-search-results__summary", className)}>
      <div className="ea-search-results__summary-text" role="status" aria-live="polite">
        <p className="ea-search-results__count">
          <span className="ea-search-results__count-value">{countLabel}</span>
          <span className="ea-search-results__count-query"> · {query}</span>
        </p>
      </div>

      <fieldset className="ea-search-results__sort">
        <legend className="ea-search-results__sort-label" id="search-results-sort-label">
          Sırala
        </legend>
        <ul className="ea-search-results__sort-list" aria-labelledby="search-results-sort-label">
          {resolvedSortOptions.map((option) => (
            <li key={option.id}>
              {option.href ? (
                <a
                  href={option.href}
                  className={getButtonClassName({
                    variant: option.selected ? "secondary" : "tertiary",
                    size: "sm",
                  })}
                  aria-current={option.selected ? "true" : undefined}
                >
                  {option.label}
                </a>
              ) : (
                <span
                  className={getButtonClassName({
                    variant: option.selected ? "secondary" : "tertiary",
                    size: "sm",
                  })}
                  aria-pressed={Boolean(option.selected)}
                >
                  {option.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );
}
