# PRD-SEO-004 — Canonical URL System Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |
| **Approach** | CanonicalResolver + denylist; allowlist API unused this PRD; preserve current strip behavior |

## Locked decisions

| Topic | Choice |
| --- | --- |
| Search | Always clean `/search` (noindex,follow unchanged) |
| Pagination allowlist | API ready (`page`); **not activated** on any page this PRD |
| Tracking | Denylist strip (utm_*, gclid, fbclid, ref, …) |
| Trailing slash / lowercase redirects | Out of scope |
| Routing | Unchanged |
| MetadataEngine | Canonical only via CanonicalResolver |

## API

```ts
resolveCanonical({
  siteUrl,
  path,                    // route pathname (may include ? accidentally)
  searchParams?: Record | URLSearchParams,
  allowQueryKeys?: readonly string[],  // unused in production wiring this PRD
}): string  // absolute URL
```

Default: strip all query keys (current behavior). Denylist documented for when allowlist is later enabled (allowed keys still exclude denylist).

`buildCanonical(siteUrl, path)` → delegates to `resolveCanonical` (strip query from path).

`buildMetadata` → `resolveCanonical({ siteUrl, path })` only (no ad-hoc query).

## Non-goals

Middleware redirects, slash policy changes, activating `page` on search/hubs, Firestore.
