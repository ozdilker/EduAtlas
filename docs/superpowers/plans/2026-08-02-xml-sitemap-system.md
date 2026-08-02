# XML Sitemap System Implementation Plan

> **For agentic workers:** Implement task-by-task. Spec: `docs/superpowers/specs/2026-08-02-xml-sitemap-system-design.md`

**Goal:** Public XML sitemap index + child sitemaps from live EduAtlas URLs, single published-institution snapshot, 50k chunking.

**Architecture:** Pure `@eduatlas/seo` generator/providers; `apps/web` loads one cached Firestore snapshot and serves `/sitemap.xml` + `/sitemaps/*.xml`.

**Tech Stack:** Next.js App Router route handlers, `unstable_cache`, Vitest, TypeScript.

## Global Constraints

- Live paths only (`/cities/...`, `/categories/...`, `/institutions/...`)
- No product routing changes
- One `listAll`/published list per cache window; providers read snapshot only
- Supply gate: hubs need ≥1 published institution
- No `dil-kursu` in sitemap
- Public, crawlable sitemap routes

---

## File map

| Path | Role |
| --- | --- |
| `packages/seo/src/sitemap/types.ts` | Entry, kind, snapshot types |
| `packages/seo/src/sitemap/defaults.ts` | changefreq/priority |
| `packages/seo/src/sitemap/derive.ts` | Hub maps from institution refs |
| `packages/seo/src/sitemap/xml.ts` | Serialize index + urlset |
| `packages/seo/src/sitemap/generator.ts` | Providers → chunks → index |
| `packages/seo/src/sitemap/providers/*.ts` | pages, cities, districts, categories, city-types, institutions |
| `packages/seo/src/sitemap/index.ts` | Barrel |
| `packages/seo/src/sitemap/sitemap.test.ts` | Unit tests |
| `apps/web/src/server/seo/load-sitemap-snapshot.ts` | Repo + resolveGeoLabels → snapshot |
| `apps/web/src/app/sitemap.xml/route.ts` | Index |
| `apps/web/src/app/sitemaps/[name]/route.ts` | Child urlsets |
| `apps/web/next.config.ts` | Add `@eduatlas/seo` transpile |

## Tasks

- [x] Task 1: SEO sitemap core (types, xml, derive, defaults, generator, providers) + tests
- [x] Task 2: Web snapshot loader + routes + transpilePackages
- [x] Task 3: typecheck + test; fix blockers only
