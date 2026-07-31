import { getButtonClassName } from "../components/button-classes";
import { cn } from "../lib/cn";
import {
  buildSearchHref,
  type SearchFiltersViewModel,
  toSearchHrefParams,
} from "./build-search-href";
import {
  getStaticSearchResultsPagination,
  type SearchResultsPageInfo,
} from "./search-results-content";

export type SearchResultsPaginationProps = {
  pagination?: SearchResultsPageInfo;
  filters?: SearchFiltersViewModel;
  className?: string;
};

/**
 * Pagination controls linked to `/search` query params.
 */
export function SearchResultsPagination({
  pagination = getStaticSearchResultsPagination(),
  filters,
  className,
}: SearchResultsPaginationProps) {
  const { currentPage, totalPages, pageNumbers } = pagination;
  const hrefFor = (page: number) =>
    filters
      ? buildSearchHref(toSearchHrefParams(filters, { page: page <= 1 ? undefined : page }))
      : undefined;

  const prevHref = currentPage > 1 ? hrefFor(currentPage - 1) : undefined;
  const nextHref = currentPage < totalPages ? hrefFor(currentPage + 1) : undefined;

  return (
    <nav className={cn("ea-search-results__pagination", className)} aria-label="Sonuç sayfaları">
      {prevHref ? (
        <a
          href={prevHref}
          className={getButtonClassName({ variant: "tertiary", size: "sm" })}
          aria-label="Önceki sayfa"
        >
          Önceki
        </a>
      ) : (
        <span
          className={getButtonClassName({ variant: "tertiary", size: "sm" })}
          aria-disabled="true"
        >
          Önceki
        </span>
      )}

      <ul className="ea-search-results__pagination-list">
        {pageNumbers.map((page) => {
          const current = page === currentPage;
          const href = hrefFor(page);

          return (
            <li key={page}>
              {href && !current ? (
                <a
                  href={href}
                  className={getButtonClassName({ variant: "tertiary", size: "sm" })}
                  aria-label={`Sayfa ${page}`}
                >
                  {page}
                </a>
              ) : (
                <span
                  className={getButtonClassName({
                    variant: current ? "secondary" : "tertiary",
                    size: "sm",
                  })}
                  aria-label={`Sayfa ${page}`}
                  aria-current={current ? "page" : undefined}
                >
                  {page}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {nextHref ? (
        <a
          href={nextHref}
          className={getButtonClassName({ variant: "tertiary", size: "sm" })}
          aria-label={`Sonraki sayfa, toplam ${totalPages} sayfa`}
        >
          Sonraki
        </a>
      ) : (
        <span
          className={getButtonClassName({ variant: "tertiary", size: "sm" })}
          aria-disabled="true"
        >
          Sonraki
        </span>
      )}
    </nav>
  );
}
