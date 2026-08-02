# PRD-SEO-003 — Dynamic Metadata Engine Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |
| **Approach** | Extend existing builders + MetadataEngine facade/registry (no greenfield rewrite) |

## Locked decisions

| Topic | Choice |
| --- | --- |
| Scope | Indexable hubs + static pages (B); auth/owner/admin out |
| Titles | Short hub formulas; keep long institution formula (A) |
| Architecture | Facade + registry over existing `buildMetadata` / page builders |
| Data | Reuse view/profile already loaded; React `cache` to avoid double fetch |
| Routing / URLs | Unchanged |

## Engine API

```ts
type MetadataPageKind =
  | "home"
  | "static"
  | "city"
  | "district"
  | "category"
  | "city-type"
  | "institution"
  | "search";

MetadataEngine.resolve(kind, { site, ...input }): PageSeoResult
```

- Registry maps kind → builder function.
- Adding a kind = register builder; do not edit other builders.
- Existing `build*PageSeo` remain public for tests/compat; pages **must** call `MetadataEngine.resolve` (or thin alias `buildPageSeo`).

## Title formulas (site name appended by `buildTitle`)

| Kind | Title parts (before brand) |
| --- | --- |
| home | site name only / home default |
| static | page-specific short title |
| city | `{CityName} eğitim kurumları` |
| district | `{DistrictName}, {CityName} eğitim kurumları` |
| category | `{CategoryName} kurumları` |
| city-type | `{CityName} {CategoryPlural}` e.g. `İstanbul Anaokulları` |
| institution | `[name, typeLabel, "{district}, {city}"]` (unchanged) |
| search | existing noindex title |

## Description

- Unique per entity; `buildDescription` max 160.
- Fallbacks never empty (city/category/district/institution shortDescription → template).

## Web migrations

Replace hardcoded `metadata` / direct builders with engine on:

- `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/cookies`, `/kvkk`
- `/cities`, `/categories`, `/institutions` indexes
- `/cities/[city]`, `/cities/[city]/[district]`, `/cities/[city]/types/[type]`
- `/categories/[category]`, `/institutions/[slug]`, `/search`

City/category `generateMetadata`: load same view as page via `cache()`-wrapped loaders; pass live name/description into engine.

## Non-goals

- Auth/owner/admin metadata centralization
- Firestore `seoPages` CMS
- AI/GEO/hreflang fields (extension points only on types if cheap)
- URL/routing changes
