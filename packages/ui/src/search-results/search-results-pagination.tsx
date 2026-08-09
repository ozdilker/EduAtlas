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
  /** Next-page Firestore cursor (empty-text / structured search). */
  nextCursor?: string | null;
  className?: string;
};

/**
 * Pagination controls linked to `/search` query params.
 * Empty-text search uses Firestore cursors for Next; free-text keeps page numbers.
 */
export function SearchResultsPagination({
  pagination = getStaticSearchResultsPagination(),
  filters,
  nextCursor = null,
  className,
}: SearchResultsPaginationProps) {
  const { currentPage, totalPages, pageNumbers } = pagination;
  const useFirestoreCursor = Boolean(filters && !filters.query.trim());

  const hrefForPage = (page: number, cursor?: string) =>
    filters
      ? buildSearchHref(
          toSearchHrefParams(filters, {
            page: page <= 1 ? undefined : page,
            cursor: cursor ?? null,
          }),
        )
      : undefined;

  const prevHref = useFirestoreCursor
    ? currentPage > 1
      ? hrefForPage(1)
      : undefined
    : currentPage > 1
      ? hrefForPage(currentPage - 1)
      : undefined;

  const nextHref = useFirestoreCursor
    ? nextCursor
      ? hrefForPage(currentPage + 1, nextCursor)
      : undefined
    : currentPage < totalPages
      ? hrefForPage(currentPage + 1)
      : undefined;

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
          const href =
            useFirestoreCursor
              ? page === 1
                ? hrefForPage(1)
                : page === currentPage + 1 && nextCursor
                  ? hrefForPage(page, nextCursor)
                  : undefined
              : hrefForPage(page);

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
