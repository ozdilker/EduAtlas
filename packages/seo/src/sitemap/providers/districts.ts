import { SITEMAP_CHANGEFREQ, SITEMAP_PRIORITY } from "../defaults";
import type { SitemapProvider } from "../types";

export const districtsSitemapProvider: SitemapProvider = Object.freeze({
  id: "districts",
  collect(snapshot) {
    return [...snapshot.districts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, lastmod]) =>
        Object.freeze({
          path: `/cities/${key}`,
          lastmod,
          changefreq: SITEMAP_CHANGEFREQ.hub,
          priority: SITEMAP_PRIORITY.district,
        }),
      );
  },
});
