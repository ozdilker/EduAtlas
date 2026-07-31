export { buildCanonical } from "./canonical";
export { buildDescription } from "./description";
export {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildSearchActionJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
} from "./json-ld";
export type { BuildMetadataOptions } from "./metadata";
export { buildMetadata } from "./metadata";
export { buildOpenGraph } from "./open-graph";
export type { PageSeoResult } from "./pages";
export {
  buildCategoryPageSeo,
  buildCityPageSeo,
  buildHomePageSeo,
  buildInstitutionPageSeo,
  buildSearchPageSeo,
  DEMO_CATEGORY_SEO,
  DEMO_CITY_SEO,
  DEMO_INSTITUTION_SEO,
  resolveCategorySeoContent,
  type CategorySeoContent,
  type InstitutionPageSeoContent,
} from "./pages";
export { createSeoSiteConfig, DEFAULT_SEO_SITE_URL, resolveSiteOrigin } from "./site";
export { buildTitle } from "./title";
export { buildTwitterCard } from "./twitter";
export type {
  BreadcrumbItem,
  JsonLdObject,
  SeoMetadata,
  SeoMetadataInput,
  SeoOpenGraph,
  SeoOpenGraphInput,
  SeoRobots,
  SeoSiteConfig,
  SeoTwitterCard,
  SeoTwitterCardInput,
} from "./types";
