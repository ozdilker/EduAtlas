import { buildBreadcrumbJsonLd } from "../json-ld/breadcrumb";
import { humanizeSlug } from "../humanize-slug";
import { buildMetadata } from "../metadata";
import type { SeoSiteConfig } from "../types";
import type { PageSeoResult } from "./home";

/** Fallback when live city name is unavailable. */
export const DEMO_CITY_SEO = {
  name: "İstanbul",
  title: "İstanbul eğitim kurumları",
  description:
    "İstanbul'da anaokulu, dershane ve eğitim kurumlarını keşfedin. Statik şehir keşif sayfası.",
} as const;

/**
 * City landing SEO — unique title/description from live city name when provided.
 */
export function buildCityPageSeo(
  site: SeoSiteConfig,
  options?: {
    citySlug?: string;
    cityName?: string;
    title?: string;
    description?: string;
  },
): PageSeoResult {
  const citySlug = options?.citySlug?.trim().toLowerCase() || "istanbul";
  const path = `/cities/${citySlug}`;
  const name =
    options?.cityName?.trim() ||
    (citySlug === "istanbul" ? DEMO_CITY_SEO.name : humanizeSlug(citySlug));
  const title = options?.title?.trim() || `${name} eğitim kurumları`;
  const description =
    options?.description?.trim() ||
    `${name}'da anaokulu, dershane ve eğitim kurumlarını keşfedin.`;

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
