import type { BreadcrumbItem, JsonLdObject, SeoSiteConfig } from "../types";

/**
 * Schema.org @type names — prefer these over magic strings in new builders.
 */
export const SchemaOrgType = Object.freeze({
  Organization: "Organization",
  LocalBusiness: "LocalBusiness",
  EducationalOrganization: "EducationalOrganization",
  School: "School",
  Preschool: "Preschool",
  LanguageSchool: "LanguageSchool",
  BreadcrumbList: "BreadcrumbList",
  FAQPage: "FAQPage",
  Review: "Review",
  AggregateRating: "AggregateRating",
  SearchAction: "SearchAction",
  WebSite: "WebSite",
  WebPage: "WebPage",
  CollectionPage: "CollectionPage",
  ItemList: "ItemList",
  ImageObject: "ImageObject",
  VideoObject: "VideoObject",
  Course: "Course",
  ListItem: "ListItem",
} as const);

export type SchemaOrgTypeName = (typeof SchemaOrgType)[keyof typeof SchemaOrgType];

/**
 * Page kinds that can emit structured data (aligned with MetadataEngine kinds).
 */
export const SCHEMA_PAGE_KINDS = [
  "home",
  "static",
  "city",
  "district",
  "category",
  "city-type",
  "institution",
  "search",
] as const;

export type SchemaPageKind = (typeof SCHEMA_PAGE_KINDS)[number];

export type SchemaHomeInput = {
  /** Home meta description from MetadataEngine / buildHomePageSeo. */
  description: string;
  /** Optional SearchAction (or other Action) for potentialAction — unused this PRD. */
  potentialAction?: JsonLdObject;
};

export type SchemaStaticInput = {
  breadcrumbLabel: string;
  /** Current static page path for ListItem.item (canonical). */
  path: string;
};

/**
 * Institution already on a listing page — passed into SchemaEngine (no extra fetch).
 */
export type SchemaListInstitutionItem = Readonly<{
  readonly name: string;
  readonly path: string;
}>;

type SchemaCollectionPageFields = {
  /** CollectionPage name (usually the page title). */
  name: string;
  description: string;
  /** Institutions rendered on the page; empty → CollectionPage without ItemList. */
  items?: readonly SchemaListInstitutionItem[];
};

export type SchemaCityInput = SchemaCollectionPageFields & {
  citySlug: string;
  cityName: string;
};

export type SchemaDistrictInput = SchemaCollectionPageFields & {
  citySlug: string;
  cityName: string;
  districtSlug: string;
  districtName: string;
};

export type SchemaCategoryInput = SchemaCollectionPageFields & {
  categorySlug: string;
  categoryName: string;
};

export type SchemaCityTypeInput = SchemaCollectionPageFields & {
  citySlug: string;
  cityName: string;
  typeSlug: string;
  typeLabel: string;
};

export type SchemaInstitutionInput = {
  name: string;
  typeLabel: string;
  typeSlug: string;
  city: string;
  citySlug: string;
  district: string;
  districtSlug: string;
  /** Institution profile path for the current ListItem.item. */
  path: string;
};

export type SchemaSearchInput = Record<string, never>;

export type SchemaInputMap = {
  home: SchemaHomeInput;
  static: SchemaStaticInput;
  city: SchemaCityInput;
  district: SchemaDistrictInput;
  category: SchemaCategoryInput;
  "city-type": SchemaCityTypeInput;
  institution: SchemaInstitutionInput;
  search: SchemaSearchInput;
};

export type SchemaBuildContext<K extends SchemaPageKind> = Readonly<{
  readonly site: SeoSiteConfig;
  readonly input: SchemaInputMap[K];
}>;

/**
 * Builds JSON-LD graph nodes for a page kind.
 * Open/Closed: register a new builder without editing others.
 */
export type SchemaBuilder<K extends SchemaPageKind = SchemaPageKind> = Readonly<{
  readonly kind: K;
  build(context: SchemaBuildContext<K>): readonly JsonLdObject[];
}>;

export type SchemaDocument = Readonly<{
  readonly graphs: readonly JsonLdObject[];
  readonly breadcrumbs?: readonly BreadcrumbItem[];
}>;
