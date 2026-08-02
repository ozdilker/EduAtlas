import { SITEMAP_CHANGEFREQ, SITEMAP_PRIORITY } from "../defaults";
import type { SitemapProvider } from "../types";

export const citiesSitemapProvider: SitemapProvider = Object.freeze({
  id: "cities",
  collect(snapshot) {
    return [...snapshot.cities.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([citySlug, lastmod]) =>
        Object.freeze({
          path: `/cities/${citySlug}`,
          lastmod,
          changefreq: SITEMAP_CHANGEFREQ.hub,
          priority: SITEMAP_PRIORITY.city,
        }),
      );
  },
});
