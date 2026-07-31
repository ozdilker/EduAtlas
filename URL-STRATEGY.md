# EduAtlas — URL Strategy

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | URL-STRATEGY.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-013 |
| **Status** | Binding permanent URL contract |
| **Last updated** | 14 July 2026 |

---

## Document control

This document defines the **canonical, long-lived URL strategy** for EduAtlas. URLs must remain stable for years so SEO equity, shares, and inbound links do not break.

| Related document | Role |
| --- | --- |
| `ROUTES.md` | App Router paths & route groups |
| `SEO-ARCHITECTURE.md` | Index gates, hub intent, internal linking |
| `NAVIGATION.md` | Human paths through URLs |
| `DOMAIN-MODEL.md` | Slug fields on entities |
| `DATA-ACQUISITION.md` | Name → slug inputs |

**Path authority stack**

1. **URL-STRATEGY.md** — canonical form, slugs, redirects, query policy  
2. **ROUTES.md** — framework route inventory  
3. **SEO-ARCHITECTURE.md** — when a URL may be indexed  

**Non-goals:** Implementation code, server config snippets, or UI chrome.

---

## 1. Purpose

Define permanent URLs that:

- Rank and share cleanly (SEO)  
- Read naturally for parents (readability)  
- Fit Turkish content with safe ASCII slugs (localization)  
- Grow to hundreds of thousands of institutions / ~1M pages (scalability)  
- Preserve equity when paths evolve (backward compatibility)

---

## 2. Goals

| Goal | How URLs support it |
| --- | --- |
| **SEO** | One intent → one canonical; stable institution URLs; hub clarity |
| **Readability** | Meaningful path segments; hyphens; no opaque IDs in public URLs |
| **Localization** | Turkish display names; ASCII-normalized slugs; `tr` locale MVP |
| **Scalability** | Finite templates; supply-gated hubs; no explosive filter indexation |
| **Backward compatibility** | 301 map from legacy schemes; slug change policy with redirects |

---

## 3. URL principles

| Principle | Rule |
| --- | --- |
| **Human readable** | Prefer `/institutions/kadikoy-gunes-anaokulu` over `/institutions/a8f2…` |
| **Lowercase** | All path segments lowercase |
| **Hyphenated slugs** | Words joined with `-` only |
| **Turkish character normalization** | Map Turkish letters to ASCII in slugs (see §7) |
| **Permanent URLs** | Do not rename paths for cosmetic reasons; version policy via redirects |
| **Canonical URLs** | Every public page declares one absolute canonical |
| **HTTPS + host** | Single preferred host (apex or `www`); HTTP/www variants 301 |
| **Trailing slash** | **No trailing slash** sitewide; slash version 301 → non-slash |
| **No file extensions** | No `.html` in public product URLs |
| **Unicode in path** | Avoid raw `ç/ğ/ı` in paths; use normalized slugs |

### 3.1 Preferred origin form

```text
https://{preferred-host}{path}[?{allowed-query}]
```

Fragment identifiers (`#section`) are not part of canonical identity.

---

## 4. Public URL catalog (canonical)

### 4.1 Core surfaces

| Surface | Canonical pattern | Example |
| --- | --- | --- |
| **Homepage** | `/` | `https://edatlas.example/` |
| **Search** | `/search` | `/search?q=anaokulu&city=istanbul` |
| **Institutions index** | `/institutions` | `/institutions` |
| **Institution** | `/institutions/{institution-slug}` | `/institutions/ankara-ornek-dershane` |
| **Cities index** | `/cities` | `/cities` |
| **City** | `/cities/{city-slug}` | `/cities/ankara` |
| **District** | `/cities/{city-slug}/{district-slug}` | `/cities/ankara/cankaya` |
| **Institution types index** | `/institution-types` | `/institution-types` |
| **Institution type** | `/institution-types/{type-slug}` | `/institution-types/dershane` |
| **Programs index** | `/programs` | `/programs` |
| **Program hub** | `/programs/{program-slug}` | `/programs/yks` |
| **Universities entry** | `/universities` | Future vertical |
| **Blog index** | `/blog` | `/blog` |
| **Blog post** | `/blog/{post-slug}` | `/blog/cankaya-anaokulu-secimi` |
| **About** | `/about` | `/about` |
| **Contact** | `/contact` | `/contact` |
| **Privacy** | `/privacy` | `/privacy` |
| **Terms** | `/terms` | `/terms` |

### 4.2 Private surfaces (noindex; stable nonetheless)

| Surface | Pattern |
| --- | --- |
| Owner portal | `/owner`, `/owner/*` |
| Admin | `/admin`, `/admin/*` |
| Auth | `/login`, `/register`, `/forgot-password`, `/verify-email` |

These URLs should also remain stable for bookmarks and emails, but must never be canonical SEO landing pages.

---

## 5. SEO hubs — canonical patterns

| Hub | Canonical URL | Primary intent |
| --- | --- | --- |
| **City** | `/cities/{city}` | City-wide discovery |
| **District** | `/cities/{city}/{district}` | Local discovery |
| **Category / type (national)** | `/institution-types/{type}` | Vertical national |
| **City × type** | `/cities/{city}/types/{type}` | `{city} {type}` queries |
| **District × type** | `/cities/{city}/{district}/{type}` | `{district} {type}` money queries |
| **Program** | `/programs/{program}` | Exam/curriculum intent (future/when live) |
| **University** | `/universities` and future child patterns | Higher-ed vertical (future) |

### 5.1 Hub indexation gate (URL policy)

A hub URL may be **published and indexed** only when SEO supply gates pass (≥ 1 published matching institution, unique intro rules). Otherwise:

- Prefer **do not serve as 200 indexable**, or  
- Serve with **`noindex`** and exclude from sitemap  

Never leave soft-404 thin hubs as permanent indexed URLs.

### 5.2 Institution vs hub

Institution identity is **not** nested under district/type in the canonical path:

```text
Canonical: /institutions/{slug}
```

Geo/type context is expressed via breadcrumbs and internal links, not by baking mutable location into the permanent institution path. This keeps URLs stable if district/type metadata changes (with hub links updated).

---

## 6. Slugs

### 6.1 Generation rules

| Step | Rule |
| --- | --- |
| 1 | Start from display name or official name (TR) |
| 2 | Lowercase |
| 3 | Turkish normalize (table below) |
| 4 | Replace spaces & punctuation with `-` |
| 5 | Collapse multiple `-` |
| 6 | Trim leading/trailing `-` |
| 7 | Enforce max length (recommended ≤ 80 chars) |
| 8 | Ensure uniqueness in scope |
| 9 | Persist slug; do not regenerate on minor name edits |

### 6.2 Turkish character normalization

| Input | Slug |
| --- | --- |
| ç / Ç | c |
| ğ / Ğ | g |
| ı / I | i |
| İ / i | i |
| ö / Ö | o |
| ş / Ş | s |
| ü / Ü | u |

Examples: `Çankaya` → `cankaya`; `Dil Kursu` → `dil-kursu`; `Özel Okul` → `ozel-okul`.

### 6.3 Scope of uniqueness

| Entity | Uniqueness |
| --- | --- |
| Institution slug | **Global** unique |
| City slug | Global unique |
| District slug | Unique within city; prefer globally unique compound if needed for disambiguation in plain text, but path already nests under city |
| Type slug | Global unique |
| Program hub slug | Global unique |
| Blog slug | Global unique |

### 6.4 Reserved words

Cannot be used as dynamic slugs where they collide with roots or segments:

```text
search, institutions, cities, institution-types, programs, universities,
blog, about, contact, privacy, terms, owner, admin, login, register,
forgot-password, verify-email, compare, favorites, events, scholarships,
exams, api, assets, static, _next, types
```

Also reserve: `www`, `cdn`, `status`, `sitemap`, `robots`.

If a city/type naturally equals a reserved word (unlikely), prefix policy: `city-{slug}` or reject at admin — document the choice in ops; prefer prevention via reserved list on taxonomy seed.

### 6.5 Duplicates

| Case | Resolution |
| --- | --- |
| Two institutions normalize to same slug | Append disambiguator: `-{district-slug}` then `-{short-hash}` or `-2`, `-3` |
| Rename collision | New slug must be free; old slug becomes redirect |
| Import collision | Dedupe entities first (`DATA-ACQUISITION`); survivor keeps slug |

### 6.6 Slug changes & permanence

| Field | Policy |
| --- | --- |
| Institution slug after first publish | **Immutable by default** |
| Exception | Admin-only change with mandatory **301** from every prior slug |
| City/type/district slugs | Treat as permanent; changes are migrations with 301 matrix |
| Blog slugs | Same as institution after publish |

Store `legacySlugs[]` (or redirect table) for all prior public paths.

---

## 7. Redirects

### 7.1 Status codes

| Code | When |
| --- | --- |
| **301** | Permanent move: legacy path, slug change, host/slash normalization |
| **302/307** | Temporary only (maintenance, A/B) — avoid for SEO path changes |
| **404** | Unknown slug; never existed / no replacement |
| **410** | Explicitly removed with no successor (confirmed closed institution with no replacement page) — optional; 301 to district×type hub often better for UX/SEO |

### 7.2 Legacy URL map (normative)

| Legacy | Canonical target |
| --- | --- |
| `/kurum/{slug}` | `/institutions/{slug}` |
| `/ara` | `/search` |
| `/hakkimizda` | `/about` |
| `/iletisim` | `/contact` |
| `/gizlilik` | `/privacy` |
| `/kullanim-kosullari` | `/terms` |
| `/{city}` | `/cities/{city}` |
| `/{city}/{district}` | `/cities/{city}/{district}` |
| `/{type}` | `/institution-types/{type}` |
| `/panel/*` | `/owner/*` |
| `/giris` | `/login` |
| `/kayit` | `/register` |

### 7.3 Entity lifecycle redirects

| Event | Redirect policy |
| --- | --- |
| Institution slug change | 301 old → new canonical |
| Institution merged (dedupe) | 301 loser → winner `/institutions/{survivor}` |
| Institution archived/closed | Prefer 301 → best hub (`district×type` or city×type); else 410 |
| Hub loses all supply | Remove from sitemap; `noindex` or 301 to parent hub |

### 7.4 Chains

Redirects must be **single-hop** to final canonical (no long 301 chains). Periodically rewrite maps to point to the final target.

---

## 8. Canonicals

### 8.1 Rules

1. Every indexable public response includes an absolute canonical URL.  
2. Canonical path matches the **preferred path** in this document (no tracking params).  
3. Self-canonical when the page is the rightful owner of the intent.  
4. `/search` with filters that equal a hub → canonical **hub URL**.  
5. HTTP, `www` mismatch, trailing slash → 301 before canonicalization content.  
6. Paginated pages: see §9.  
7. Owner/Admin/Auth: canonical optional; always `noindex`.  
8. Unpublished institutions: not publicly served (or `noindex`); no sitemap entry.

### 8.2 Absolute form

```text
rel=canonical → https://{preferred-host}/institutions/{slug}
```

Never canonicalize to a redirecting URL.

---

## 9. Pagination

| Surface | URL pattern | Canonical rule |
| --- | --- | --- |
| Hubs & `/institutions` | `?page={n}` **or** `/page/{n}` — **choose one sitewide** | Recommend **`?page=`** for simplicity |
| Page 1 | Omit `page` or `page=1` | Canonical **without** `page` (normalize `page=1` → clean URL via 301) |
| Page 2+ | `?page=2` … | **Self-canonical** if page has unique list content; include in sitemap only if strategically valuable (usually page 1 + crawlable next links suffice) |
| Empty high pages | 404 or redirect to last page / page 1 | Do not index empty pages |

**Sorting variants must not create additional indexable paginated trees** (see §10–11).

---

## 10. Filter URLs — indexable vs non-indexable

### 10.1 Indexable (hub templates only)

These **path** templates are the indexable filter equivalents:

| Intent | Indexable URL |
| --- | --- |
| City | `/cities/{city}` |
| District | `/cities/{city}/{district}` |
| Type | `/institution-types/{type}` |
| City + type | `/cities/{city}/types/{type}` |
| District + type | `/cities/{city}/{district}/{type}` |
| Program | `/programs/{program}` (when live + gated) |

### 10.2 Non-indexable filter surfaces

| Surface | Rule |
| --- | --- |
| `/search?…` arbitrary combos | `noindex,follow` (or `nofollow` as policy allows); exclude sitemap |
| Extra facets (open now, price, boarding, multi-type) | Query only; never path-explode; `noindex` |
| Owner/admin list filters | Private; `noindex` |

### 10.3 Mapping search → hub

When the active filter set **exactly** matches a hub, UX may show hub content at the hub URL (preferred) or keep `/search` with **canonical pointing to the hub**.

---

## 11. Query parameters

### 11.1 Classes

| Class | Examples | Indexed? | In canonical? |
| --- | --- | --- | --- |
| **Filtering (search)** | `q`, `city`, `district`, `type` | No (search URL) | No — hub canonical when applicable |
| **Sorting** | `sort=name`, `sort=relevance` | No | No — strip from canonical |
| **Pagination** | `page` | Page 1 stripped; 2+ per §9 | Per §9 |
| **Tracking** | `utm_*`, `gclid`, `fbclid` | N/A | **Never** in canonical; need not 301-strip if canonical tag clean |
| **Session/debug** | `preview`, `token` | No | No; `noindex` |

### 11.2 Allowed public query keys (MVP)

```text
q, city, district, type, page, sort
```

Unknown keys ignored for logic; do not generate sitemaps for them.

### 11.3 Parameter order

For cache cleanliness, normalize order when redirecting optional: `q`, `city`, `district`, `type`, `sort`, `page`. Not required if canonical tag is correct.

---

## 12. Future: internationalization & multi-country

### 12.1 MVP lock

- Single locale: **Turkish content**  
- Single country: **Türkiye**  
- No `hreflang` required  
- No `/en/...` tree in MVP  

### 12.2 English URLs (future)

When English ships, prefer **prefix strategy**:

```text
/en/cities/ankara
/en/institutions/{slug}
```

Turkish remains default unprefixed **or** move to `/tr/` only with full 301 plan — **do not** flip defaults casually.

Rules:

- One language version per locale with `hreflang` bidirectional  
- Slugs may stay ASCII shared or gain locale-specific slugs with careful canonical/hreflang pairing  
- Do not duplicate indexable thin translations  

### 12.3 Multi-country (future)

Prefer country + locale prefix only when product expands:

```text
/{country}/{locale}/...
```

Example (illustrative): `/tr/tr/cities/ankara` — **not** adopted until multi-country is real. Until then, keep today’s unprefixed Türkiye canonicals permanent.

---

## 13. Sitemap & robots implications

| Item | URL strategy rule |
| --- | --- |
| Sitemap | Only final canonical, indexable URLs |
| Legacy paths | Not in sitemap |
| Search URLs | Not in sitemap |
| Paginated page 2+ | Generally omit unless explicitly strategized |
| robots.txt | Disallow `/owner`, `/admin`, auth routes |

---

## 14. Stability guarantees (product promises)

1. **Institution canonical path shape** `/institutions/{slug}` will not be renamed without a versioned strategy revision + bulk 301.  
2. **Hub path shapes** under `/cities` and `/institution-types` are permanent templates.  
3. **Slug characters** remain ASCII-normalized Turkish.  
4. **No trailing slash** and **HTTPS preferred host** remain permanent.  
5. Legacy aliases in §7.2 remain redirected for a minimum of **36 months** after cutover (longer recommended).

---

## 15. Decision summary

| Topic | Decision |
| --- | --- |
| Institution URL | `/institutions/{slug}` (not nested geo) |
| City / district | `/cities/{city}`, `/cities/{city}/{district}` |
| Types | `/institution-types/{type}` |
| Money pages | `/cities/{city}/types/{type}`, `/cities/{city}/{district}/{type}` |
| Search | `/search` non-indexable filter UI |
| Slugs | Lowercase, hyphenated, TR→ASCII |
| Pagination | `?page=`; page 1 unparameterized |
| Tracking params | Stripped from canonical |
| i18n | Unprefixed TR now; `/en` later |

---

## 16. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| SEO | | | ☐ |
| Engineering | | | ☐ |
| Product | | | ☐ |

**Summary:** EduAtlas permanent URLs are **lowercase, hyphenated, Turkish-normalized** paths under stable templates (`/institutions`, `/cities`, `/institution-types`, …), with **institution identity decoupled from geo nesting**, **hub paths as the only indexable filters**, strict **canonical/redirect** discipline, and a clear future path to `/en` without breaking today’s Türkiye URLs.
