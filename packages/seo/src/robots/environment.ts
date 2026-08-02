/**
 * Parses EDUATLAS_ALLOW_ROBOTS (and similar) into a crawl-allowed flag.
 * Only explicit truthy values enable crawl; everything else blocks.
 */
export function isRobotsCrawlAllowed(raw: string | undefined | null): boolean {
  const value = raw?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}
