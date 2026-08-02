import { serializeSitemapIndex } from "@eduatlas/seo";
import {
  loadSitemapDocuments,
  SITEMAP_HTTP_CACHE_CONTROL,
} from "@/server/seo/load-sitemap-snapshot";

export const revalidate = 3600;

/**
 * Public sitemap index — Search Console entry point.
 */
export async function GET(): Promise<Response> {
  const { snapshot, built } = await loadSitemapDocuments();
  const xml = serializeSitemapIndex(snapshot.siteUrl, built.children);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_HTTP_CACHE_CONTROL,
    },
  });
}
