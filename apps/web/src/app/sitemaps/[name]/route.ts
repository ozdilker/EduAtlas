import { serializeUrlset } from "@eduatlas/seo";
import {
  loadSitemapDocuments,
  SITEMAP_HTTP_CACHE_CONTROL,
} from "@/server/seo/load-sitemap-snapshot";

export const revalidate = 3600;

type SitemapChildRouteProps = {
  params: Promise<{ name: string }>;
};

/**
 * Public child sitemap urlsets under /sitemaps/*.xml
 */
export async function GET(
  _request: Request,
  { params }: SitemapChildRouteProps,
): Promise<Response> {
  const { name } = await params;
  const fileName = name.trim().toLowerCase();

  if (!fileName.endsWith(".xml") || fileName.includes("/") || fileName.includes("..")) {
    return new Response("Not Found", { status: 404 });
  }

  const { snapshot, built } = await loadSitemapDocuments();
  const entries = built.urlsets.get(fileName);

  if (!entries) {
    return new Response("Not Found", { status: 404 });
  }

  const xml = serializeUrlset(snapshot.siteUrl, entries);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_HTTP_CACHE_CONTROL,
    },
  });
}
