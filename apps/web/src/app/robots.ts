import { getServerEnv } from "@eduatlas/config";
import {
  isRobotsCrawlAllowed,
  resolveRobotsPolicy,
  toRobotsMetadataDocument,
} from "@eduatlas/seo";
import type { MetadataRoute } from "next";
import { getSeoSiteConfig } from "@/lib/seo-site";

export const revalidate = 3600;

/**
 * Thin adapter: env flag + site config → SEO robots policy → Next `/robots.txt`.
 */
export default function robots(): MetadataRoute.Robots {
  const site = getSeoSiteConfig();
  const allowRobots = isRobotsCrawlAllowed(getServerEnv().EDUATLAS_ALLOW_ROBOTS);
  const document = toRobotsMetadataDocument(resolveRobotsPolicy(allowRobots), {
    siteUrl: site.siteUrl,
  });

  const rules =
    document.rules.length === 1 ? document.rules[0]! : [...document.rules];

  return {
    rules,
    ...(document.sitemap ? { sitemap: document.sitemap } : {}),
  };
}
