import { MetadataEngine } from "@eduatlas/seo";
import { CityIndexPage } from "@eduatlas/ui";
import { getSeoSiteConfig } from "@/lib/seo-site";

export const metadata = MetadataEngine.resolve("static", getSeoSiteConfig(), {
  pageId: "cities-index",
}).metadata;

export default function CitiesIndexRoute() {
  return <CityIndexPage />;
}
