# PRD-SEO-001 — XML Sitemap System Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved & implemented |
| **PRD** | PRD-SEO-001 |
| **Related** | PRD-SEO-000 URL Architecture Audit |

---

## 1. Goals

- Expose a public, crawlable XML sitemap index and child sitemaps so search engines can discover all **indexable** EduAtlas URLs.
- Preserve the **live URL architecture** (no route rewrites).
- Scale toward 25k+ institutions (50k URL / 50MB chunking).
- Minimize Firestore load via a **single published-institution snapshot** per generation.
- Keep generation modular (Open/Closed): new sitemap kinds = new provider, not core rewrites.

### Non-goals

- Changing public/owner/admin routes or slugs.
- Implementing `robots.txt` (later SEO PRD).
- HTML sitemap / footer link farms.
- Instant cache bust on every write (TTL cache is enough for this PRD; optional `revalidateTag` can follow).

---

## 2. Decisions (locked)

| Decision | Choice |
| --- | --- |
| URL paths | Live paths only: `/cities/...`, `/categories/...`, `/institutions/...` |
| Delivery | Custom App Router route handlers (not Next `generateSitemaps` IDs) |
| City × type hubs | Separate child sitemap `city-types` |
| Empty hubs | Omit unless ≥ 1 **Published** institution (supply gate) |
| Category aliases | Include canonical type slugs only (`dil-okulu`; **not** `dil-kursu`) |
| Sitemap routes | **Public and indexable** (no auth; response is XML for crawlers) |
| Data loading | **One** published-institution snapshot per cache window; providers share it |

---

## 3. Public HTTP surface

| URL | Content-Type | Purpose |
| --- | --- | --- |
| `/sitemap.xml` | `application/xml` | Sitemap **index** listing all child sitemaps |
| `/sitemaps/pages.xml` | `application/xml` | Static public pages |
| `/sitemaps/cities.xml` | `application/xml` | City hubs with supply ≥ 1 |
| `/sitemaps/districts.xml` | `application/xml` | District hubs with supply ≥ 1 |
| `/sitemaps/categories.xml` | `application/xml` | National category hubs with supply ≥ 1 |
| `/sitemaps/city-types.xml` | `application/xml` | `/cities/{city}/types/{type}` with supply ≥ 1 |
| `/sitemaps/institutions.xml` | `application/xml` | Institution profiles (chunk 1) |
| `/sitemaps/institutions-{n}.xml` | `application/xml` | Extra chunks when > 50k URLs (n ≥ 2) |

Notes:

- `/sitemap.xml` is the Search Console entry point (PRD “sitemap-index” role).
- Routes are **unauthenticated**, cacheable, and must not set `noindex` on the HTTP response in a way that blocks discovery of the sitemap document itself. (They are machine-readable indexes, not HTML landing pages.)
- Unknown `/sitemaps/*` → `404`.

No changes to existing page routes.

---

## 4. URL inventory (live paths only)

### pages

| Path | changefreq | priority |
| --- | --- | --- |
| `/` | daily | 1.0 |
| `/about` | monthly | 0.5 |
| `/contact` | monthly | 0.5 |
| `/privacy` | monthly | 0.5 |
| `/terms` | monthly | 0.5 |
| `/cookies` | monthly | 0.5 |
| `/kvkk` | monthly | 0.5 |
| `/cities` | weekly | 0.7 |
| `/categories` | weekly | 0.7 |

**Excluded:** `/search`, `/login`, `/register`, `/forgot-password`, `/owner/*`, `/admin/*`, `/veli/*`, `/claim`, `/api/*`, error pages, previews.

`/institutions` index: include only if it is a public indexable listing without being a thin duplicate of search; default **include** as static-ish discovery page at priority 0.6 monthly — or omit if product treats it as non-canonical. **Decision for this PRD:** include `/institutions` at priority `0.6`, changefreq `weekly`.

### cities

`/cities/{citySlug}` — only cities that appear on ≥ 1 Published institution (`city.slug` / `cityId` match).

- changefreq `weekly`, priority `0.9`
- lastmod: max(`updatedAt`) of published institutions in that city (fallback: geography seed timestamp if needed)

### districts

`/cities/{citySlug}/{districtSlug}` — supply ≥ 1.

- changefreq `weekly`, priority `0.8`
- lastmod: max institution `updatedAt` in that district

### categories

`/categories/{typeSlug}` for each `getInstitutionTypeSlug(type)` with supply ≥ 1.

- changefreq `weekly`, priority `0.9`
- lastmod: max institution `updatedAt` for that primary type
- **Do not** emit `dil-kursu`

### city-types

`/cities/{citySlug}/types/{typeSlug}` — supply ≥ 1 for that city×type pair.

- changefreq `weekly`, priority `0.8`
- lastmod: max matching institution `updatedAt`

### institutions

`/institutions/{slug}` for every **Published** institution with a valid public slug.

- changefreq `weekly`, priority `0.8`
- lastmod: `updatedAt` (fallback `publishedAt` / `createdAt`)

Auto-split into multiple urlsets when entry count > **50_000** or serialized size would exceed **50 MB** (implement count-first split at 50_000; size check as secondary safety).

---

## 5. Architecture

```text
apps/web (HTTP + cache + data adapters)
  GET /sitemap.xml
  GET /sitemaps/[name].xml
        │
        ▼
  loadSitemapSnapshot()   ← cached; ONE Firestore listAll (published filter in memory)
        │
        ▼
@eduatlas/seo (pure generation)
  SitemapSnapshot
  SitemapProvider[]  (pages, cities, districts, categories, cityTypes, institutions)
  SitemapGenerator.buildIndex(entriesByKind) → index locs
  SitemapGenerator.buildUrlset(entries) → chunked urlsets
  serializeSitemapIndex / serializeUrlset
```

### 5.1 Single snapshot

`SitemapSnapshot` (built once per cache miss):

```ts
type SitemapInstitutionRef = {
  slug: string;
  updatedAt: string;       // ISO
  publishedAt?: string;
  createdAt?: string;
  citySlug: string;
  districtSlug: string;
  typeSlug: string;        // canonical public type slug
};

type SitemapSnapshot = {
  generatedAt: string;
  siteUrl: string;
  institutions: readonly SitemapInstitutionRef[];
  // Derived indexes (computed once from institutions):
  citySlugs: ReadonlySet<string>; // or map slug → lastmod
  districtKeys: ReadonlyMap<string, string>; // "city/district" → lastmod
  typeSlugs: ReadonlyMap<string, string>;    // type → lastmod
  cityTypeKeys: ReadonlyMap<string, string>; // "city|type" → lastmod
};
```

**Firestore rule:** At most **one** `listAll()` (or equivalent published list) per snapshot build. Geography catalog comes from **in-memory seed** (`buildTurkeyGeographySeedCatalog`) — no extra geo Firestore reads required for path validation. Filter to Published; drop rows missing slug/city/district/type as needed for hub keys.

Providers **must not** call repositories. They only read `SitemapSnapshot` (+ static page list).

### 5.2 Providers (Open/Closed)

```ts
interface SitemapProvider {
  readonly id: SitemapKind; // 'pages' | 'cities' | ...
  collect(snapshot: SitemapSnapshot): readonly SitemapUrlEntry[];
}
```

Register providers in an array; generator iterates. Adding `blog` later = new provider + route name mapping.

### 5.3 Generator

- Merge provider outputs into kind buckets.
- For institutions (and any kind exceeding limits), chunk to ≤ 50_000 URLs.
- Emit absolute `loc` via existing `buildCanonical(siteUrl, path)`.
- Include `lastmod`, `changefreq`, `priority` per PRD defaults.

### 5.4 Web adapters

- Resolve `siteUrl` via `getSeoSiteConfig()`.
- Load published institutions through existing institution repository/store (same published gate as public site).
- Map domain/Firestore records → `SitemapInstitutionRef`.
- Wrap snapshot build in **`unstable_cache` / `cache`** with:
  - `revalidate: 3600` (1 hour)
  - tag: `sitemap` (for optional future `revalidateTag('sitemap')` on publish)

Within one request that needs index + awareness of chunk count, build snapshot **once** and reuse.

---

## 6. Caching & freshness

| Layer | Behavior |
| --- | --- |
| Snapshot cache | 3600s; shared across all sitemap routes |
| HTTP | `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` |
| New institutions | Appear in sitemap within TTL (automatic, no manual edit) |

No per-request full rebuild when cache is warm. No N× hub count Firestore queries.

---

## 7. XML shape (sketch)

**Index (`/sitemap.xml`):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://eduatlas.com.tr/sitemaps/pages.xml</loc>
    <lastmod>2026-08-02T09:00:00.000Z</lastmod>
  </sitemap>
  <!-- cities, districts, categories, city-types, institutions, institutions-2... -->
</sitemapindex>
```

**Urlset:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://eduatlas.com.tr/cities/istanbul</loc>
    <lastmod>2026-08-01T12:00:00.000Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

UTF-8; escape `&`, `<`, `>`, `"`, `'` in locs.

---

## 8. Package / file plan

### `@eduatlas/seo`

- `src/sitemap/types.ts`
- `src/sitemap/defaults.ts` — changefreq/priority tables
- `src/sitemap/snapshot.ts` — derive hub indexes from institution refs (pure)
- `src/sitemap/xml.ts` — serialize index + urlset
- `src/sitemap/generator.ts` — chunk + assemble
- `src/sitemap/providers/*.ts` — one file per kind
- `src/sitemap/index.ts` — public API
- `src/sitemap/sitemap.test.ts` — unit tests (XML, chunking, supply gate, exclusions)
- Export from package barrel

### `apps/web`

- `src/app/sitemap.xml/route.ts` — index
- `src/app/sitemaps/[name]/route.ts` — child urlsets (`pages.xml` handled by parsing `name` with `.xml` or use `[[...]]` / rewrite)

**Routing note:** App Router dynamic segment `[name]` receives `pages.xml` if the file is `sitemaps/[name]/route.ts` and request is `/sitemaps/pages.xml` — `name` = `pages.xml`. Parse and strip `.xml`.

- `src/server/seo/load-sitemap-snapshot.ts` — Firestore + seed → snapshot (cached)

**Do not** add `@eduatlas/seo` Firebase dependency. Keep SEO package pure.

Transpile: add `@eduatlas/seo` to `next.config.ts` `transpilePackages` if not already (audit said missing).

---

## 9. Testing

- Unit: provider outputs for a tiny fixture snapshot (paths, priorities, no owner/admin, no `dil-kursu`, supply gate drops empty cities).
- Unit: chunking at 50_001 → two institution sitemap locs in index.
- Unit: XML escaping.
- `npm run typecheck` + `npm test` at PRD end.
- Manual: hit `/sitemap.xml` and one child in local/dev after implement (smoke).

---

## 10. Acceptance mapping

| Criterion | How |
| --- | --- |
| sitemap index | `/sitemap.xml` |
| Child sitemaps auto | providers + generator |
| URL structure preserved | live paths only |
| No admin/owner | pages denylist + no provider for those trees |
| Scalable | 50k chunking |
| Cache | unstable_cache + Cache-Control |
| New institutions auto | next snapshot rebuild within TTL |
| Clean Architecture | pure seo + web adapter |
| Typecheck / no breakage | CI scripts |

---

## 11. Out of scope follow-ups

- `robots.txt` + GSC submit guidance (SEO-002-ish)
- `revalidateTag('sitemap')` on publish/unpublish
- Blog / program sitemaps when those routes exist
- Size-based split stress test with real 50MB payloads

---

## Spec self-review

- [x] No unresolved placeholders
- [x] Live paths consistent with SEO-000 (not bare `/istanbul`)
- [x] Single-snapshot rule explicit
- [x] city-types included as approved
- [x] Supply gate B explicit
- [x] Public/indexable sitemap routes explicit
- [x] No routing refactor of product pages
