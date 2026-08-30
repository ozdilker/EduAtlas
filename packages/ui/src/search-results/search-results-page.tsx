import { Container } from "../components/container";
import type { InstitutionCardViewData } from "../institution/institution-card-content";
import { PublicNextSteps } from "../layout/public-next-steps";
import { PublicStatusBlock } from "../layout/public-status";
import { cn } from "../lib/cn";
import { getGenericInstitutionSearchHint, getSearchStatusMessage } from "../search/search-content";
import type { SearchFiltersViewModel } from "./build-search-href";
import { SearchAiRecommendations } from "./search-ai-recommendations";
import { SearchPendingTransition } from "./search-pending-transition";
import {
  type SearchResultsPageInfo,
  type SearchResultsSortOption,
} from "./search-results-content";
import { SearchLocationGate } from "./search-location-gate";
import { SearchResultsGrid } from "./search-results-grid";
import { SearchResultsHeader } from "./search-results-header";
import { SearchResultsPagination } from "./search-results-pagination";
import { SearchResultsSidebar } from "./search-results-sidebar";
import { SearchResultsSkeleton } from "./search-results-skeleton";
import { SearchResultsSummary } from "./search-results-summary";

export type SearchResultsPageProps = {
  query?: string;
  institutions?: InstitutionCardViewData[];
  resultCount?: number;
  pagination?: SearchResultsPageInfo;
  /** Next Firestore cursor for empty-text / structured pagination. */
  nextCursor?: string | null;
  sortOptions?: SearchResultsSortOption[];
  filters?: SearchFiltersViewModel;
  /** Visual loading only — does not change search/filter behavior. */
  loading?: boolean;
  /** Registered parent session — gates personalized AI recommendations. */
  isParent?: boolean;
  /** Free-text without city — show location gate; no result scan ran. */
  locationRequired?: boolean;
  /** Generic-only query (no distinctive name token) — extra empty-state hint. */
  genericQueryHint?: boolean;
  className?: string;
};

/**
 * Public search results page — accepts repository-backed InstitutionCard DTOs.
 */
export function SearchResultsPage({
  query = "",
  institutions = [],
  resultCount = institutions.length,
  pagination,
  nextCursor = null,
  sortOptions,
  filters,
  loading = false,
  isParent = false,
  locationRequired = false,
  genericQueryHint = false,
  className,
}: SearchResultsPageProps) {
  const trimmedQuery = query.trim();
  const showLocationGate = Boolean(locationRequired);
  const isEmpty = !loading && !showLocationGate && resultCount === 0;
  const countLabel =
    resultCount === 0 ? "0 kurum" : resultCount === 1 ? "1 kurum" : `${resultCount} kurum`;
  const queryLabel = trimmedQuery || "tüm kurumlar";

  return (
    <SearchPendingTransition>
      <div className={cn("ea-search-results", loading && "ea-search-results--loading", className)}>
        <SearchResultsHeader
          defaultQuery={trimmedQuery}
          requireCityForText
          preserveFilters={
            filters
              ? {
                  ...filters.active,
                  sort: filters.sort,
                }
              : undefined
          }
        />

        <Container size="xl" className="ea-search-results__layout">
          <SearchResultsSidebar filters={filters} />

          <div className="ea-search-results__main">
            {showLocationGate ? (
              <SearchLocationGate query={trimmedQuery} filters={filters} />
            ) : (
              <>
                <SearchResultsSummary
                  resultCountLabel={countLabel}
                  queryLabel={queryLabel}
                  sortOptions={sortOptions}
                  filters={filters}
                />

                {!loading ? <SearchAiRecommendations enabled={isParent} filters={filters} /> : null}

                {loading ? (
                  <SearchResultsSkeleton />
                ) : isEmpty ? (
                  <PublicStatusBlock
                    tone="empty"
                    titleAs="h2"
                    title="Sonuç bulunamadı"
                    message={
                      trimmedQuery
                        ? [
                            getSearchStatusMessage("empty") ??
                              "Aramanızla eşleşen kurum yok. Farklı bir anahtar kelime veya filtre deneyin.",
                            genericQueryHint ? getGenericInstitutionSearchHint() : null,
                          ]
                            .filter(Boolean)
                            .join(" ")
                        : "Henüz listelenecek yayınlanmış kurum yok. Şehir veya kategori keşfiyle başlayabilirsiniz."
                    }
                    primaryAction={{ id: "cities", label: "Şehirlere göz at", href: "/cities" }}
                    actions={[
                      { id: "categories", label: "Kurum türleri", href: "/categories" },
                      { id: "home", label: "Ana sayfa", href: "/" },
                      ...(filters
                        ? [{ id: "clear", label: "Filtreleri temizle", href: "/search" }]
                        : []),
                    ]}
                    className="ea-search-results__empty"
                  />
                ) : (
                  <>
                    <SearchResultsGrid institutions={institutions} />
                    {pagination ? (
                      <SearchResultsPagination
                        pagination={pagination}
                        filters={filters}
                        nextCursor={nextCursor}
                      />
                    ) : null}
                  </>
                )}

                <PublicNextSteps
                  title="Sonuçlardan sonra"
                  links={[
                    { id: "cities", label: "Şehir hub’ları", href: "/cities" },
                    { id: "categories", label: "Kurum tipleri", href: "/categories" },
                    { id: "ankara", label: "Ankara", href: "/cities/ankara" },
                    { id: "search", label: "Aramayı temizle", href: "/search" },
                  ]}
                />
              </>
            )}
          </div>
        </Container>
      </div>
    </SearchPendingTransition>
  );
}
