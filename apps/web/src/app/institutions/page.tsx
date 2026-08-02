import { MetadataEngine } from "@eduatlas/seo";
import { InstitutionsBrowsePage } from "@eduatlas/ui";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { searchPublicInstitutions } from "@/server/institutions/search-public-institutions";

export const dynamic = "force-dynamic";

export const metadata = MetadataEngine.resolve("static", getSeoSiteConfig(), {
  pageId: "institutions-index",
}).metadata;

/**
 * Public institutions index — real published institutions from search.
 */
export default async function InstitutionsBrowseRoute() {
  const view = await searchPublicInstitutions({
    page: 1,
    pageSize: 24,
  });

  return (
    <InstitutionsBrowsePage
      institutions={view.institutions}
      totalCount={view.result.page.totalItems}
    />
  );
}
