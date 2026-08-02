import { CanonicalResolver } from "../canonical";
import type { SeoSiteConfig } from "../types";

/**
 * Stable JSON-LD @id anchors derived from the site canonical origin.
 */
export function resolveOrganizationSchemaId(site: Pick<SeoSiteConfig, "siteUrl">): string {
  return `${homeCanonical(site)}#organization`;
}

export function resolveWebSiteSchemaId(site: Pick<SeoSiteConfig, "siteUrl">): string {
  return `${homeCanonical(site)}#website`;
}

/**
 * Stable @id for an institution EducationalOrganization node.
 */
export function resolveEducationalOrganizationSchemaId(
  site: Pick<SeoSiteConfig, "siteUrl">,
  institutionPath: string,
): string {
  const url = CanonicalResolver.resolve({
    siteUrl: site.siteUrl,
    path: institutionPath,
  });
  return `${url}#educationalorganization`;
}

/**
 * Absolute site origin without trailing slash (except we never emit bare empty).
 */
export function resolveSiteOriginUrl(site: Pick<SeoSiteConfig, "siteUrl">): string {
  const home = homeCanonical(site);
  return home.endsWith("/") ? home.slice(0, -1) : home;
}

function homeCanonical(site: Pick<SeoSiteConfig, "siteUrl">): string {
  return CanonicalResolver.resolve({ siteUrl: site.siteUrl, path: "/" });
}
