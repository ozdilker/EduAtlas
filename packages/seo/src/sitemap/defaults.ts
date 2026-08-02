import type { SitemapChangeFreq } from "./types";

export const SITEMAP_PRIORITY = Object.freeze({
  home: 1.0,
  city: 0.9,
  category: 0.9,
  district: 0.8,
  cityType: 0.8,
  institution: 0.8,
  indexHub: 0.7,
  institutionsIndex: 0.6,
  staticPage: 0.5,
} as const);

export const SITEMAP_CHANGEFREQ = Object.freeze({
  home: "daily" as SitemapChangeFreq,
  hub: "weekly" as SitemapChangeFreq,
  institution: "weekly" as SitemapChangeFreq,
  staticPage: "monthly" as SitemapChangeFreq,
});
