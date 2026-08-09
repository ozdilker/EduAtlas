import { MetadataEngine } from "@eduatlas/seo";
import { InstitutionsBrowsePage } from "@eduatlas/ui";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { listPublicInstitutionsBrowse } from "@/server/institutions/list-public-institutions-browse";

export const dynamic = "force-dynamic";

export const metadata = MetadataEngine.resolve("static", getSeoSiteConfig(), {
  pageId: "institutions-index",
}).metadata;

/**
 * Public institutions index — published cards via bounded Firestore browse (no listAll).
 */
export default async function InstitutionsBrowseRoute() {
  const view = await listPublicInstitutionsBrowse({
    pageSize: 24,
  });

  return (
    <InstitutionsBrowsePage
      institutions={view.institutions}
      totalCount={view.totalCount}
    />
  );
}
