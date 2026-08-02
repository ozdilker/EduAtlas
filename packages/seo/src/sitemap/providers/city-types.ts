import { SITEMAP_CHANGEFREQ, SITEMAP_PRIORITY } from "../defaults";
import type { SitemapProvider } from "../types";

export const cityTypesSitemapProvider: SitemapProvider = Object.freeze({
  id: "city-types",
  collect(snapshot) {
    return [...snapshot.cityTypes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, lastmod]) => {
        const [citySlug, typeSlug] = key.split("|");
        return Object.freeze({
          path: `/cities/${citySlug}/types/${typeSlug}`,
          lastmod,
          changefreq: SITEMAP_CHANGEFREQ.hub,
          priority: SITEMAP_PRIORITY.cityType,
        });
      });
  },
});
