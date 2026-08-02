import { SITEMAP_CHANGEFREQ, SITEMAP_PRIORITY } from "../defaults";
import type { SitemapProvider } from "../types";

function institutionLastmod(ref: {
  updatedAt: string;
  publishedAt?: string;
  createdAt?: string;
}): string {
  return ref.updatedAt || ref.publishedAt || ref.createdAt || "";
}

export const institutionsSitemapProvider: SitemapProvider = Object.freeze({
  id: "institutions",
  collect(snapshot) {
    return snapshot.institutions
      .filter((ref) => Boolean(ref.slug))
      .slice()
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((ref) =>
        Object.freeze({
          path: `/institutions/${ref.slug}`,
          lastmod: institutionLastmod(ref) || snapshot.generatedAt,
          changefreq: SITEMAP_CHANGEFREQ.institution,
          priority: SITEMAP_PRIORITY.institution,
        }),
      );
  },
});
