/**
 * Framework-agnostic SEO contracts.
 * Compatible with Next.js Metadata shapes without depending on Next.js.
 */

export type SeoPostalAddress = Readonly<{
  readonly streetAddress?: string;
  readonly addressLocality?: string;
  readonly addressRegion?: string;
  readonly postalCode?: string;
  readonly addressCountry?: string;
}>;

export type SeoSiteConfig = {
  siteName: string;
  siteUrl: string;
  locale?: string;
  defaultDescription?: string;
  logoUrl?: string;
  defaultImageUrl?: string;
  twitterHandle?: string;
  /**
   * Public site-search pathname (no query), e.g. `/search`.
   * Used by SearchAction urlTemplate — not hardcoded in builders.
   */
  searchPath?: string;
  /**
   * Query parameter bound to Schema.org `search_term_string` (live search uses `q`).
   */
  searchQueryParam?: string;
  /** Organization contact email — omitted from schema when unset. */
  organizationEmail?: string;
  /** Organization telephone — omitted when unset. */
  organizationTelephone?: string;
  /** Organization postal address — omitted when unset / empty. */
  organizationAddress?: SeoPostalAddress;
  /** ISO date (YYYY-MM-DD) — omitted when unset. */
  organizationFoundingDate?: string;
  /** Official social profile URLs for sameAs — empty entries ignored. */
  organizationSameAs?: readonly string[];
};

export type SeoRobots = {
  index?: boolean;
  follow?: boolean;
};

export type SeoOpenGraphInput = {
  title: string;
  description: string;
  url: string;
  type?: "website" | "article";
  siteName?: string;
  locale?: string;
  images?: string[];
};

export type SeoTwitterCardInput = {
  title: string;
  description: string;
  card?: "summary" | "summary_large_image";
  images?: string[];
  site?: string;
};

export type SeoMetadataInput = {
  title: string;
  description: string;
  canonical: string;
  robots?: SeoRobots;
  openGraph?: SeoOpenGraphInput;
  twitter?: SeoTwitterCardInput;
  /** When true, title is emitted as absolute (ignores layout title template). */
  absoluteTitle?: boolean;
};

export type SeoOpenGraph = {
  title: string;
  description: string;
  url: string;
  type: "website" | "article";
  siteName: string;
  locale: string;
  images?: Array<{ url: string }>;
};

export type SeoTwitterCard = {
  card: "summary" | "summary_large_image";
  title: string;
  description: string;
  images?: string[];
  site?: string;
};

export type SeoMetadata = {
  title: string | { absolute: string };
  description: string;
  alternates: {
    canonical: string;
  };
  robots?: SeoRobots;
  openGraph: SeoOpenGraph;
  twitter: SeoTwitterCard;
};

export type BreadcrumbItem = {
  name: string;
  path?: string;
};

export type JsonLdObject = Record<string, unknown>;
