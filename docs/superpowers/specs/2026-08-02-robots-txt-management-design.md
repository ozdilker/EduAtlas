# PRD-SEO-002 — Robots.txt Management Design

| Field | Value |
| --- | --- |
| **Date** | 2026-08-02 |
| **Status** | Approved |
| **PRD** | PRD-SEO-002 |

## Locked decisions

| Topic | Choice |
| --- | --- |
| Architecture | `@eduatlas/seo` RobotsPolicy + RobotsGenerator; `app/robots.ts` thin adapter |
| Crawl allow gate | `EDUATLAS_ALLOW_ROBOTS=true` only; otherwise `Disallow: /` |
| `/search` | Not Disallow’d; keep meta `noindex, follow` |
| `Host:` | Omit (add later if Yandex needs it) |
| Sitemap in robots | Only `{siteUrl}/sitemap.xml` when crawl allowed |
| Routing | Unchanged |

## Production document (flag on)

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /owner
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /veli
Disallow: /claim
Disallow: /api
Disallow: /preview
Disallow: /test
Disallow: /health
Sitemap: https://eduatlas.com.tr/sitemap.xml
```

## Blocked document (flag off)

```
User-agent: *
Disallow: /
```

## Module layout (`packages/seo/src/robots/`)

- `types.ts` — rule / group / policy / document
- `policies.ts` — default production + blocked policies (extensible rule lists)
- `environment.ts` — `isRobotsCrawlAllowed(rawFlag)`
- `generator.ts` — `buildRobotsTxt(policy, { siteUrl })`
- `robots.test.ts`
- Export from `@eduatlas/seo`

Future bot-specific groups = additional `RobotsUserAgentGroup` entries; generator unchanged.

## Web

- `apps/web/src/app/robots.ts` — read env flag + site URL → policy → return `MetadataRoute.Robots` **or** plain text via mapping from same policy
- Prefer mapping policy → `MetadataRoute.Robots` for Next native `/robots.txt`
- `revalidate: 3600`
- Optional: document `EDUATLAS_ALLOW_ROBOTS` in env example if one exists

## Non-goals

- Per-bot rules (GPTBot, etc.)
- UTM Disallow lines (canonical handles)
- Host directive
- Changing page metadata / routing
