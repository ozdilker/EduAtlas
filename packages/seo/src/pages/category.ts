import { buildBreadcrumbJsonLd } from "../json-ld/breadcrumb";
import { buildMetadata } from "../metadata";
import type { SeoSiteConfig } from "../types";
import type { PageSeoResult } from "./home";

export type CategorySeoContent = {
  readonly name: string;
  readonly title: string;
  readonly description: string;
};

/** Fallback when slug is unknown — kept for backward-compatible demo defaults. */
export const DEMO_CATEGORY_SEO: CategorySeoContent = {
  name: "Anaokulu",
  title: "Anaokulu kurumları",
  description:
    "Türkiye genelinde anaokulu seçeneklerini keşfedin. Kategori keşif sayfası.",
};

const CATEGORY_SEO_BY_SLUG: Readonly<Record<string, CategorySeoContent>> = Object.freeze({
  anaokulu: {
    name: "Anaokulu",
    title: "Anaokulu kurumları",
    description: "Türkiye genelinde anaokulu seçeneklerini keşfedin.",
  },
  kres: {
    name: "Kreş",
    title: "Kreş kurumları",
    description: "Türkiye genelinde kreş seçeneklerini keşfedin.",
  },
  "ozel-okul": {
    name: "Özel Okul",
    title: "Özel okul kurumları",
    description: "Türkiye genelinde özel okul seçeneklerini keşfedin.",
  },
  dershane: {
    name: "Dershane",
    title: "Dershane kurumları",
    description: "Türkiye genelinde dershane seçeneklerini keşfedin.",
  },
  "etut-merkezi": {
    name: "Etüt Merkezi",
    title: "Etüt merkezi kurumları",
    description: "Türkiye genelinde etüt merkezi seçeneklerini keşfedin.",
  },
  "dil-okulu": {
    name: "Dil Okulu",
    title: "Dil okulu kurumları",
    description: "Türkiye genelinde dil okulu seçeneklerini keşfedin.",
  },
  "dil-kursu": {
    name: "Dil Kursu",
    title: "Dil kursu kurumları",
    description: "Türkiye genelinde dil kursu seçeneklerini keşfedin.",
  },
});

/**
 * Resolves category SEO copy from a public category slug.
 */
export function resolveCategorySeoContent(
  categorySlug: string | undefined,
  overrides?: Partial<CategorySeoContent>,
): CategorySeoContent {
  const slug = categorySlug?.trim().toLowerCase() || "anaokulu";
  const base = CATEGORY_SEO_BY_SLUG[slug] ?? {
    name: overrides?.name?.trim() || humanizeSlug(slug),
    title: `${overrides?.name?.trim() || humanizeSlug(slug)} kurumları`,
    description: `Türkiye genelinde ${
      (overrides?.name?.trim() || humanizeSlug(slug)).toLocaleLowerCase("tr-TR")
    } seçeneklerini keşfedin.`,
  };

  const name = overrides?.name?.trim() || base.name;
  const title = overrides?.title?.trim() || `${name} kurumları`;
  const description =
    overrides?.description?.trim() ||
    base.description ||
    `Türkiye genelinde ${name.toLocaleLowerCase("tr-TR")} seçeneklerini keşfedin.`;

  return { name, title, description };
}

/**
 * Category landing SEO — title and copy follow the selected category slug.
 */
export function buildCategoryPageSeo(
  site: SeoSiteConfig,
  options?: {
    categorySlug?: string;
    categoryName?: string;
    title?: string;
    description?: string;
  },
): PageSeoResult {
  const categorySlug = options?.categorySlug?.trim() || "anaokulu";
  const path = `/categories/${categorySlug}`;
  const { name, title, description } = resolveCategorySeoContent(categorySlug, {
    name: options?.categoryName,
    title: options?.title,
    description: options?.description,
  });

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
        [{ name: "Ana sayfa", path: "/" }, { name: "Kategoriler", path: "/categories" }, { name }],
        site,
      ),
    ],
  };
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}
