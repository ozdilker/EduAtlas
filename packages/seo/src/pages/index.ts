export { buildCategoryPageSeo, DEMO_CATEGORY_SEO, resolveCategorySeoContent } from "./category";
export type { CategorySeoContent } from "./category";
export { buildCityPageSeo, DEMO_CITY_SEO } from "./city";
export {
  buildCityTypePageSeo,
  CATEGORY_PLURAL_BY_SLUG,
  resolveCategoryPluralLabel,
} from "./city-type";
export { buildDistrictPageSeo } from "./district";
export type { PageSeoResult } from "./home";
export { buildHomePageSeo } from "./home";
export {
  buildInstitutionPageSeo,
  DEMO_INSTITUTION_SEO,
  type InstitutionPageSeoContent,
} from "./institution";
export { buildSearchPageSeo } from "./search";
export {
  buildStaticPageSeo,
  listStaticPageSeoIds,
  type StaticPageSeoId,
} from "./static";
