import { SITEMAP_CHANGEFREQ, SITEMAP_PRIORITY } from "../defaults";
import type { SitemapProvider, SitemapUrlEntry } from "../types";

const STATIC_PAGES: readonly Omit<SitemapUrlEntry, "lastmod">[] = Object.freeze([
  { path: "/", changefreq: SITEMAP_CHANGEFREQ.home, priority: SITEMAP_PRIORITY.home },
  {
    path: "/about",
    changefreq: SITEMAP_CHANGEFREQ.staticPage,
    priority: SITEMAP_PRIORITY.staticPage,
  },
  {
    path: "/contact",
    changefreq: SITEMAP_CHANGEFREQ.staticPage,
    priority: SITEMAP_PRIORITY.staticPage,
  },
  {
    path: "/privacy",
    changefreq: SITEMAP_CHANGEFREQ.staticPage,
    priority: SITEMAP_PRIORITY.staticPage,
  },
  {
    path: "/terms",
    changefreq: SITEMAP_CHANGEFREQ.staticPage,
    priority: SITEMAP_PRIORITY.staticPage,
  },
  {
    path: "/cookies",
    changefreq: SITEMAP_CHANGEFREQ.staticPage,
    priority: SITEMAP_PRIORITY.staticPage,
  },
  {
    path: "/kvkk",
    changefreq: SITEMAP_CHANGEFREQ.staticPage,
    priority: SITEMAP_PRIORITY.staticPage,
  },
  {
    path: "/cities",
    changefreq: SITEMAP_CHANGEFREQ.hub,
    priority: SITEMAP_PRIORITY.indexHub,
  },
  {
    path: "/categories",
    changefreq: SITEMAP_CHANGEFREQ.hub,
    priority: SITEMAP_PRIORITY.indexHub,
  },
  {
    path: "/institutions",
    changefreq: SITEMAP_CHANGEFREQ.hub,
    priority: SITEMAP_PRIORITY.institutionsIndex,
  },
]);

export const pagesSitemapProvider: SitemapProvider = Object.freeze({
  id: "pages",
  collect(snapshot) {
    return STATIC_PAGES.map((page) =>
      Object.freeze({
        ...page,
        lastmod: snapshot.generatedAt,
      }),
    );
  },
});
