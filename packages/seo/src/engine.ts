import type { SeoSiteConfig } from "./types";
import { buildCategoryPageSeo } from "./pages/category";
import { buildCityPageSeo } from "./pages/city";
import { buildCityTypePageSeo } from "./pages/city-type";
import { buildDistrictPageSeo } from "./pages/district";
import { buildHomePageSeo, type PageSeoResult } from "./pages/home";
import { buildInstitutionPageSeo, type InstitutionPageSeoContent } from "./pages/institution";
import { buildSearchPageSeo } from "./pages/search";
import { buildStaticPageSeo, type StaticPageSeoId } from "./pages/static";

export type MetadataPageKind =
  | "home"
  | "static"
  | "city"
  | "district"
  | "category"
  | "city-type"
  | "institution"
  | "search";

type HomeInput = Record<string, never>;

type StaticInput = {
  pageId: StaticPageSeoId;
  title?: string;
  description?: string;
};

type CityInput = {
  citySlug?: string;
  cityName?: string;
  title?: string;
  description?: string;
};

type DistrictInput = {
  citySlug?: string;
  districtSlug?: string;
  cityName?: string;
  districtName?: string;
  title?: string;
  description?: string;
};

type CategoryInput = {
  categorySlug?: string;
  categoryName?: string;
  title?: string;
  description?: string;
};

type CityTypeInput = {
  citySlug?: string;
  typeSlug?: string;
  cityName?: string;
  typeName?: string;
  title?: string;
  description?: string;
};

type InstitutionInput = Partial<InstitutionPageSeoContent> & {
  slug?: string;
};

type SearchInput = Record<string, never>;

export type MetadataEngineInputMap = {
  home: HomeInput;
  static: StaticInput;
  city: CityInput;
  district: DistrictInput;
  category: CategoryInput;
  "city-type": CityTypeInput;
  institution: InstitutionInput;
  search: SearchInput;
};

type MetadataBuilder<K extends MetadataPageKind> = (
  site: SeoSiteConfig,
  input: MetadataEngineInputMap[K],
) => PageSeoResult;

const registry: { [K in MetadataPageKind]: MetadataBuilder<K> } = {
  home: (site) => buildHomePageSeo(site),
  static: (site, input) => buildStaticPageSeo(site, input),
  city: (site, input) => buildCityPageSeo(site, input),
  district: (site, input) => buildDistrictPageSeo(site, input),
  category: (site, input) => buildCategoryPageSeo(site, input),
  "city-type": (site, input) => buildCityTypePageSeo(site, input),
  institution: (site, input) => buildInstitutionPageSeo(site, input),
  search: (site) => buildSearchPageSeo(site),
};

/**
 * Central metadata facade — pages resolve SEO through this registry only.
 * Open/Closed: add a kind by extending the map + registry entry.
 */
export const MetadataEngine = {
  resolve<K extends MetadataPageKind>(
    kind: K,
    site: SeoSiteConfig,
    input: MetadataEngineInputMap[K] = {} as MetadataEngineInputMap[K],
  ): PageSeoResult {
    const builder = registry[kind] as MetadataBuilder<K>;
    return builder(site, input);
  },

  kinds(): readonly MetadataPageKind[] {
    return Object.keys(registry) as MetadataPageKind[];
  },
} as const;

/**
 * Convenience alias matching older call sites.
 */
export function buildPageSeo<K extends MetadataPageKind>(
  kind: K,
  site: SeoSiteConfig,
  input?: MetadataEngineInputMap[K],
): PageSeoResult {
  return MetadataEngine.resolve(kind, site, input ?? ({} as MetadataEngineInputMap[K]));
}
