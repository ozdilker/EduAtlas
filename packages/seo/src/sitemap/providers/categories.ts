import { SITEMAP_CHANGEFREQ, SITEMAP_PRIORITY } from "../defaults";
import type { SitemapProvider } from "../types";

export const categoriesSitemapProvider: SitemapProvider = Object.freeze({
  id: "categories",
  collect(snapshot) {
    return [...snapshot.categories.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([typeSlug, lastmod]) =>
        Object.freeze({
          path: `/categories/${typeSlug}`,
          lastmod,
          changefreq: SITEMAP_CHANGEFREQ.hub,
          priority: SITEMAP_PRIORITY.category,
        }),
      );
  },
});
