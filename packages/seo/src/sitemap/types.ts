/**
 * Sitemap domain types — pure, no I/O.
 */

export const SITEMAP_KINDS = [
  "pages",
  "cities",
  "districts",
  "categories",
  "city-types",
  "institutions",
] as const;

export type SitemapKind = (typeof SITEMAP_KINDS)[number];

export type SitemapChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type SitemapUrlEntry = Readonly<{
  readonly path: string;
  readonly lastmod?: string;
  readonly changefreq: SitemapChangeFreq;
  readonly priority: number;
}>;

export type SitemapInstitutionRef = Readonly<{
  readonly slug: string;
  readonly updatedAt: string;
  readonly publishedAt?: string;
  readonly createdAt?: string;
  readonly citySlug: string;
  readonly districtSlug: string;
  readonly typeSlug: string;
}>;

export type SitemapSnapshot = Readonly<{
  readonly generatedAt: string;
  readonly siteUrl: string;
  readonly institutions: readonly SitemapInstitutionRef[];
  /** citySlug → lastmod ISO */
  readonly cities: ReadonlyMap<string, string>;
  /** `${citySlug}/${districtSlug}` → lastmod ISO */
  readonly districts: ReadonlyMap<string, string>;
  /** typeSlug → lastmod ISO */
  readonly categories: ReadonlyMap<string, string>;
  /** `${citySlug}|${typeSlug}` → lastmod ISO */
  readonly cityTypes: ReadonlyMap<string, string>;
}>;

export type SitemapProvider = Readonly<{
  readonly id: SitemapKind;
  collect(snapshot: SitemapSnapshot): readonly SitemapUrlEntry[];
}>;

export type SitemapChildRef = Readonly<{
  readonly name: string;
  readonly path: string;
  readonly lastmod: string;
}>;

export type SitemapBuildResult = Readonly<{
  readonly children: readonly SitemapChildRef[];
  readonly urlsets: ReadonlyMap<string, readonly SitemapUrlEntry[]>;
}>;

/** Google soft limit for URLs per sitemap file. */
export const SITEMAP_MAX_URLS_PER_FILE = 50_000;
