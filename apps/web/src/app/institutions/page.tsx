import { InstitutionsBrowsePage } from "@eduatlas/ui";
import type { Metadata } from "next";
import { searchPublicInstitutions } from "@/server/institutions/search-public-institutions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kurumlar",
  description: "Türkiye’deki yayınlı eğitim kurumlarını keşfedin.",
};

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
