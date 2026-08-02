import { buildCanonical } from "../canonical";
import type { SitemapChildRef, SitemapUrlEntry } from "./types";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatPriority(priority: number): string {
  return priority.toFixed(1);
}

/**
 * Serializes a sitemap index document.
 */
export function serializeSitemapIndex(
  siteUrl: string,
  children: readonly SitemapChildRef[],
): string {
  const body = children
    .map((child) => {
      const loc = buildCanonical(siteUrl, child.path);
      return [
        "  <sitemap>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${escapeXml(child.lastmod)}</lastmod>`,
        "  </sitemap>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</sitemapindex>",
    "",
  ].join("\n");
}

/**
 * Serializes a urlset document from path-based entries.
 */
export function serializeUrlset(siteUrl: string, entries: readonly SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const loc = buildCanonical(siteUrl, entry.path);
      const lines = [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
      ];
      if (entry.lastmod) {
        lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }
      lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      lines.push(`    <priority>${formatPriority(entry.priority)}</priority>`);
      lines.push("  </url>");
      return lines.join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
    "",
  ].join("\n");
}
