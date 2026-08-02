import { AppRole } from "@eduatlas/domain";
import { MetadataEngine } from "@eduatlas/seo";
import { SearchResultsPage } from "@eduatlas/ui";
import { JsonLd } from "@/components/json-ld";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getCurrentSession } from "@/server/auth/current-session";
import { searchPublicInstitutions } from "@/server/institutions/search-public-institutions";
import {
  getSearchFilterOptions,
  toSearchFiltersInput,
} from "@/server/search/search-filter-options";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    city?: string | string[];
    district?: string | string[];
    type?: string | string[];
    verified?: string | string[];
    premium?: string | string[];
    sort?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export async function generateMetadata() {
  return MetadataEngine.resolve("search", getSeoSiteConfig()).metadata;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const pageRaw = Number.parseInt(firstParam(params.page) || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const sort = firstParam(params.sort).trim() || "relevance";

  const filterOptions = getSearchFilterOptions({
    query,
    sort,
    cityId: firstParam(params.city),
    districtId: firstParam(params.district),
    type: firstParam(params.type),
    verified: firstParam(params.verified),
    premium: firstParam(params.premium),
  });

  const view = await searchPublicInstitutions({
    text: query,
    page,
    pageSize: 12,
    sort,
    filters: toSearchFiltersInput(filterOptions.active),
  });

  const session = await getCurrentSession();
  const isParent = session?.user.role === AppRole.Parent;

  const searchSeo = MetadataEngine.resolve("search", getSeoSiteConfig());
  const totalPages = view.result.page.totalPages;
  const currentPage = view.result.page.page;
  const pagination =
    totalPages > 1
      ? {
          currentPage,
          totalPages,
          pageNumbers: Array.from({ length: totalPages }, (_, index) => index + 1).slice(
            Math.max(0, currentPage - 3),
            Math.max(0, currentPage - 3) + 5,
          ),
        }
      : undefined;

  return (
    <>
      <JsonLd data={searchSeo.jsonLd} />
      <SearchResultsPage
        query={view.query}
        institutions={[...view.institutions]}
        resultCount={view.result.page.totalItems}
        pagination={pagination}
        filters={filterOptions}
        isParent={isParent}
      />
    </>
  );
}
