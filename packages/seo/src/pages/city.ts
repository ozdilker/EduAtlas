import { buildBreadcrumbJsonLd } from "../json-ld/breadcrumb";
import { buildMetadata } from "../metadata";
import type { SeoSiteConfig } from "../types";
import type { PageSeoResult } from "./home";

/** Static demo city SEO content — no live data. */
export const DEMO_CITY_SEO = {
  name: "İstanbul",
  title: "İstanbul eğitim kurumları",
  description:
    "İstanbul'da anaokulu, dershane ve eğitim kurumlarını keşfedin. Statik şehir keşif sayfası.",
} as const;

/**
 * City landing SEO using static demo content.
 * City slug only affects the canonical path.
 */
export function buildCityPageSeo(
  site: SeoSiteConfig,
  options?: {
    citySlug?: string;
  },
): PageSeoResult {
  const citySlug = options?.citySlug?.trim() || "istanbul";
  const path = `/cities/${citySlug}`;
  const { name, title, description } = DEMO_CITY_SEO;

  const metadata = buildMetadata({
    site,
    title: [title],
    description,
    path,
  });

  return {
    metadata,
    jsonLd: [
      buildBreadcrumbJsonLd(
        [{ name: "Ana sayfa", path: "/" }, { name: "Şehirler", path: "/cities" }, { name }],
        site,
      ),
    ],
  };
}
