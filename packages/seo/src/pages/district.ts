import { humanizeSlug } from "../humanize-slug";
import { buildMetadata } from "../metadata";
import { SchemaEngine } from "../schema";
import type { SeoSiteConfig } from "../types";
import type { PageSeoResult } from "./home";

/**
 * District hub SEO — `/cities/{city}/{district}`.
 */
export function buildDistrictPageSeo(
  site: SeoSiteConfig,
  options?: {
    citySlug?: string;
    districtSlug?: string;
    cityName?: string;
    districtName?: string;
    title?: string;
    description?: string;
  },
): PageSeoResult {
  const citySlug = options?.citySlug?.trim().toLowerCase() || "istanbul";
  const districtSlug = options?.districtSlug?.trim().toLowerCase() || "kadikoy";
  const cityName = options?.cityName?.trim() || humanizeSlug(citySlug);
  const districtName = options?.districtName?.trim() || humanizeSlug(districtSlug);
  const path = `/cities/${citySlug}/${districtSlug}`;
  const title = options?.title?.trim() || `${districtName}, ${cityName} eğitim kurumları`;
  const description =
    options?.description?.trim() ||
    `${districtName}, ${cityName}'da eğitim kurumlarını keşfedin.`;

  const metadata = buildMetadata({
    site,
    title: [title],
    description,
    path,
  });

  return {
    metadata,
    jsonLd: [
      ...SchemaEngine.build("district", site, {
        citySlug,
        cityName,
        districtName,
      }),
    ],
  };
}
