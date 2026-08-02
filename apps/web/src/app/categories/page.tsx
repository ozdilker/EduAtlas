import { MetadataEngine } from "@eduatlas/seo";
import { CategoryIndexPage } from "@eduatlas/ui";
import { getSeoSiteConfig } from "@/lib/seo-site";

export const metadata = MetadataEngine.resolve("static", getSeoSiteConfig(), {
  pageId: "categories-index",
}).metadata;

export default function CategoriesIndexRoute() {
  return <CategoryIndexPage />;
}
