import { buildBreadcrumbJsonLd } from "../json-ld/breadcrumb";
import { humanizeSlug } from "../humanize-slug";
import { buildMetadata } from "../metadata";
import type { SeoSiteConfig } from "../types";
import { resolveCategorySeoContent } from "./category";
import type { PageSeoResult } from "./home";

/** Public plural labels for city×type hub titles (PRD short formula). */
export const CATEGORY_PLURAL_BY_SLUG: Readonly<Record<string, string>> = Object.freeze({
  anaokulu: "Anaokulları",
  kres: "Kreşler",
  "ozel-okul": "Özel Okulları",
  dershane: "Dershaneleri",
  "etut-merkezi": "Etüt Merkezleri",
  "dil-okulu": "Dil Okulları",
  "dil-kursu": "Dil Kursları",
});

/**
 * Resolves a Turkish plural label for a category/type slug.
 */
export function resolveCategoryPluralLabel(typeSlug: string, typeName?: string): string {
  const slug = typeSlug.trim().toLowerCase();
  return (
    CATEGORY_PLURAL_BY_SLUG[slug] ??
    `${typeName?.trim() || humanizeSlug(slug)} kurumları`
  );
}

/**
 * City × category hub SEO — `/cities/{city}/types/{type}`.
 */
export function buildCityTypePageSeo(
  site: SeoSiteConfig,
  options?: {
    citySlug?: string;
    typeSlug?: string;
    cityName?: string;
    typeName?: string;
    title?: string;
    description?: string;
  },
): PageSeoResult {
  const citySlug = options?.citySlug?.trim().toLowerCase() || "istanbul";
  const typeSlug = options?.typeSlug?.trim().toLowerCase() || "anaokulu";
  const cityName = options?.cityName?.trim() || humanizeSlug(citySlug);
  const category = resolveCategorySeoContent(typeSlug, { name: options?.typeName });
  const typeName = options?.typeName?.trim() || category.name;
  const plural = resolveCategoryPluralLabel(typeSlug, typeName);
  const path = `/cities/${citySlug}/types/${typeSlug}`;
  const title = options?.title?.trim() || `${cityName} ${plural}`;
  const description =
    options?.description?.trim() ||
    `${cityName}'da ${typeName.toLocaleLowerCase("tr-TR")} seçeneklerini keşfedin.`;

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
        [
          { name: "Ana sayfa", path: "/" },
          { name: "Şehirler", path: "/cities" },
          { name: cityName, path: `/cities/${citySlug}` },
          { name: plural },
        ],
        site,
      ),
    ],
  };
}
