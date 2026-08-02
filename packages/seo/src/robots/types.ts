/**
 * Robots.txt policy types — pure, no I/O.
 */

export type RobotsDirectiveType = "allow" | "disallow";

export type RobotsPathRule = Readonly<{
  readonly type: RobotsDirectiveType;
  readonly path: string;
}>;

export type RobotsUserAgentGroup = Readonly<{
  readonly userAgent: string;
  readonly rules: readonly RobotsPathRule[];
}>;

export type RobotsPolicy = Readonly<{
  readonly groups: readonly RobotsUserAgentGroup[];
  /** Absolute path of the sitemap index, e.g. `/sitemap.xml`. Omitted when crawl blocked. */
  readonly sitemapPath?: string;
}>;

export type BuildRobotsTxtOptions = Readonly<{
  readonly siteUrl: string;
}>;

export type RobotsMetadataRules = Readonly<{
  readonly userAgent: string | string[];
  readonly allow?: string | string[];
  readonly disallow?: string | string[];
}>;

export type RobotsMetadataDocument = Readonly<{
  readonly rules: readonly RobotsMetadataRules[];
  readonly sitemap?: string | string[];
}>;
