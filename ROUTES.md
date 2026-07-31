# EduAtlas — Routes Specification

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | ROUTES.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-011 |
| **Status** | Binding App Router route contract |
| **Framework** | Next.js App Router |
| **Last updated** | 14 July 2026 |

---

## Document control

This document defines **every route** in EduAtlas and the App Router organization (route groups, layouts, loading/error boundaries, metadata).

| Related document | Role |
| --- | --- |
| `SEO-ARCHITECTURE.md` | Intent hierarchy, index gates, slug normalization |
| `UI-ARCHITECTURE.md` | Screens behind routes |
| `SYSTEM-ARCHITECTURE.md` | Rendering (SSR/ISR) & apps |
| `INSTITUTION-PROFILE-SPECIFICATION.md` | Institution detail behavior |
| `PRD.md` | MVP scope |

**Non-goals:** Implementation code, React components, or Firebase rules.

**Path authority:** For Next.js file routes and product links, **this document wins**. SEO content rules (Turkish copy, index gates, internal linking) remain in `SEO-ARCHITECTURE.md`. Where older drafts used `/kurum/*`, `/ara`, or bare `/{city}` paths, treat those as **legacy aliases** to redirect here (see §10).

---

## 1. Purpose

Define the routing architecture for Türkiye’s education ecosystem platform so that:

1. Public SEO pages are stable, crawlable, and metadata-complete.  
2. Owner and Admin surfaces are clearly isolated.  
3. Auth routes are shared and predictable.  
4. Future surfaces can be added without breaking MVP routes.

---

## 2. App Router concepts (normative)

| Concept | Usage in EduAtlas |
| --- | --- |
| **Route groups** | `(public)`, `(owner)`, `(admin)`, `(auth)` — organize layouts without affecting the URL |
| **Dynamic segments** | `[city]`, `[district]`, `[type]`, `[slug]`, `[program]` |
| **Layouts** | Nested chrome per surface |
| **`loading.tsx`** | Segment-level loading UI |
| **`error.tsx`** | Segment-level error boundary |
| **`not-found.tsx`** | Unknown slugs / missing entities |
| **Metadata API** | Static + `generateMetadata` for dynamic SEO routes |
| **Parallel/intercepting routes** | Optional later (gallery modal); not required for MVP |

---

## 3. Route groups

```text
app/
  layout.tsx                 → Root Layout
  not-found.tsx
  (public)/
    layout.tsx               → Public Layout
    ...public pages
  (auth)/
    layout.tsx               → Auth Layout (minimal chrome)
    login / register / ...
  (owner)/
    layout.tsx               → Dashboard Layout (owner shell)
    owner/...
  (admin)/
    layout.tsx               → Admin Layout
    admin/...
```

| Group | URL prefix | Audience | Auth |
| --- | --- | --- | --- |
| **(public)** | none / resource roots | Visitors, crawlers | None |
| **(auth)** | `/login`, etc. | Owners (parents later) | Guest-focused |
| **(owner)** | `/owner/*` | Institution Owner | Required + approved claim |
| **(admin)** | `/admin/*` | Moderator / Admin / Super Admin | Required + role |

Route group folders **do not** appear in the URL.

---

## 4. Layouts

| Layout | Wraps | Responsibilities |
| --- | --- | --- |
| **Root Layout** | Entire app | `html`/`body`, global providers, fonts, skip link, base metadata |
| **Public Layout** | `(public)` | Marketing header, footer, public search entry, public nav |
| **Auth Layout** | `(auth)` | Minimal chrome, centered forms, link back to home |
| **Dashboard Layout** | `(owner)` | Owner sidebar/topbar, institution context, portal nav |
| **Admin Layout** | `(admin)` | Admin console nav, queue badges, dense shell |

Unauthorized access to `(owner)` / `(admin)` redirects to `/login` with return URL, or renders 403 via error UI per `UI-ARCHITECTURE.md`.

---

## 5. Public routes

### 5.1 Inventory

| Route | Purpose | MVP | Index |
| --- | --- | --- | --- |
| `/` | Home | Yes | Yes |
| `/search` | Global search & filters | Yes | Conditional† |
| `/institutions` | National institution directory / browse | Yes | Yes |
| `/institutions/[slug]` | Institution profile | Yes | If published |
| `/cities` | City index | Yes | Yes |
| `/cities/[city]` | City hub | Yes | If supply gate |
| `/cities/[city]/[district]` | District hub | Yes | If supply gate |
| `/institution-types` | Type index | Yes | Yes |
| `/institution-types/[type]` | National type hub | Yes | If supply gate |
| `/programs` | Program hubs index | Future | When shipped |
| `/programs/[program]` | National program hub | Future | When shipped |
| `/blog` | Blog index | Partial/Future | When posts exist |
| `/blog/[slug]` | Article | Partial/Future | If published |
| `/about` | About | Yes | Yes |
| `/contact` | Platform contact | Yes | Yes |
| `/privacy` | Privacy policy | Yes | Yes |
| `/terms` | Terms of use | Yes | Yes |

† `/search`: prefer `noindex` for arbitrary filter combos; canonicalize to hub routes when filters equal a city/district/type hub (`SEO-ARCHITECTURE.md`).

### 5.2 SEO hub extensions (required for product SEO)

The following public routes are **in scope for MVP routing** even though abbreviated in the task list—they implement city×type and district×type money pages:

| Route | Purpose | Index |
| --- | --- | --- |
| `/cities/[city]/types/[type]` | City × institution type hub | If supply ≥ 1 |
| `/cities/[city]/[district]/[type]` | District × type hub | If supply ≥ 1 |

Params `[city]`, `[district]`, `[type]` use **Turkish-normalized slugs** (e.g. `ankara`, `cankaya`, `dershane`, `dil-kursu`) per SEO slug rules.

### 5.3 Dynamic segment contracts

| Param | Resolves to | Failure |
| --- | --- | --- |
| `[slug]` | Institution by public slug | `not-found` |
| `[city]` | City entity slug | `not-found` |
| `[district]` | District under city | `not-found` |
| `[type]` | InstitutionType slug | `not-found` |
| `[program]` | Program hub slug | `not-found` |
| Blog `[slug]` | BlogPost slug | `not-found` |

### 5.4 Public route notes

| Route | Notes |
| --- | --- |
| `/institutions` | Paginated browse; filters may deep-link to `/search` or hub URLs |
| `/institutions/[slug]` | Canonical institution page (replaces legacy `/kurum/[slug]`) |
| `/contact` | `ContactRequest` form — not institution lead |
| Lead success | Prefer inline success on profile or `/institutions/[slug]/thank-you` with `noindex` (implementation choice); not a marketing indexable |

---

## 6. Owner portal routes

All routes under `/owner` require authentication and an **approved** institution ownership (or pending-only screens where specified).

| Route | Purpose | MVP |
| --- | --- | --- |
| `/owner` | Portal home / snapshot | Yes |
| `/owner/profile` | Owner user profile (account) | Yes |
| `/owner/institution` | Institution profile management | Yes |
| `/owner/gallery` | Logo & gallery management | Yes |
| `/owner/programs` | Programs editor | Partial |
| `/owner/leads` | Leads inbox | Yes |
| `/owner/settings` | Notification & account prefs | Yes |

### 6.1 Recommended nested owner routes (non-breaking extensions)

| Route | Purpose |
| --- | --- |
| `/owner/leads/[leadId]` | Lead detail |
| `/owner/claim` | Claim status / submit if pending |
| `/owner/analytics` | Basic analytics (may live on `/owner` initially) |

**Indexation:** Entire `/owner/*` tree is **`noindex`** and should be disallowed in `robots.txt`.

---

## 7. Admin routes

All `/admin/*` routes require Moderator+ role (finer checks per screen).

| Route | Purpose | MVP |
| --- | --- | --- |
| `/admin` | Ops home / KPIs | Yes |
| `/admin/institutions` | Institution list & moderation | Yes |
| `/admin/users` | Users / owners / roles | Yes |
| `/admin/leads` | Cross-institution leads | Yes |
| `/admin/blog` | Blog CMS | Partial/Future |
| `/admin/seo` | SEO pages & index flags | Yes |
| `/admin/settings` | System settings | Yes |
| `/admin/reports` | Reports | Basic |

### 7.1 Recommended nested admin routes

| Route | Purpose |
| --- | --- |
| `/admin/institutions/new` | Create institution |
| `/admin/institutions/[id]` | Admin institution detail/edit |
| `/admin/claims` | Claim queue (if not embedded in institutions) |
| `/admin/seo/[id]` | Single SEO page editor |
| `/admin/blog/[id]` | Post editor |

**Indexation:** Entire `/admin/*` tree is **`noindex`** + robots disallow.

---

## 8. Auth routes

| Route | Purpose | MVP |
| --- | --- | --- |
| `/login` | Sign in | Yes |
| `/register` | Create account (owners) | Yes |
| `/forgot-password` | Password reset request | Yes |
| `/verify-email` | Email verification landing | Yes |

**Rules**

- Auth layouts are minimal; no public marketing footer noise required.  
- Support `?next=` (or equivalent) return to `/owner` or `/admin`.  
- Authenticated users hitting `/login` redirect to their default surface.  
- **`noindex`** on auth routes.

Claim entry may start from public CTAs → `/login` or `/register` → owner claim flow.

---

## 9. Future routes

Reserved URL space — do not reuse for unrelated features.

| Route | Purpose |
| --- | --- |
| `/compare` | Institution comparison |
| `/favorites` | Parent favorites list |
| `/events` | Events discovery |
| `/scholarships` | Scholarships discovery |
| `/universities` | University vertical entry |
| `/exams` | Exam-oriented hubs (LGS/YKS, etc.) |

When shipped: add to public group (or dedicated group), define metadata/index rules, update SEO architecture.

Additional future patterns already anticipated:

- `/institutions/[slug]/programs/[program]` — program under institution  
- `/owner/subscription` — premium billing  

---

## 10. Legacy aliases & redirects

To preserve continuity with earlier SEO drafts and inbound links:

| Legacy / alternate | Target | Type |
| --- | --- | --- |
| `/kurum/[slug]` | `/institutions/[slug]` | 301 |
| `/ara` | `/search` | 301 |
| `/hakkimizda` | `/about` | 301 |
| `/iletisim` | `/contact` | 301 |
| `/gizlilik` | `/privacy` | 301 |
| `/kullanim-kosullari` | `/terms` | 301 |
| `/{city}` (bare) | `/cities/{city}` | 301 |
| `/{city}/{district}` | `/cities/{city}/{district}` | 301 |
| `/{type}` (bare type) | `/institution-types/{type}` | 301 |
| `/panel/*`, `/giris` | `/owner/*`, `/login` | 301 |

Bare geo URLs must not collide with reserved roots: `search`, `institutions`, `cities`, `institution-types`, `programs`, `blog`, `about`, `contact`, `privacy`, `terms`, `owner`, `admin`, `login`, `register`, `compare`, `favorites`, etc.

---

## 11. Loading, error, not-found

| File | Scope | Behavior |
| --- | --- | --- |
| **`loading.tsx`** | Per segment (public hubs, institution, owner, admin tables) | Skeleton matching layout; avoid layout shift |
| **`error.tsx`** | Per segment + root | Recovery CTA; log correlation id; no secrets |
| **`not-found.tsx`** | Root + optional segment | 404 UI with search entry (public); simple deny in portals |

| HTTP/UX case | Mechanism |
| --- | --- |
| Unknown institution slug | `notFound()` in server page |
| Unpublished institution (public) | `notFound()` or dedicated gone UI (prefer not found for MVP) |
| Forbidden portal | 403 UI / redirect login |
| Server failure | `error.tsx` |

Offline messaging is client UX (`UI-ARCHITECTURE.md`), not a distinct route.

---

## 12. SEO: metadata & canonicals

### 12.1 Metadata generation

| Route class | Strategy |
| --- | --- |
| Static (`/about`, `/privacy`, …) | Static `metadata` export |
| Hubs & institution | `generateMetadata` from entity + SEO templates |
| Search | Dynamic; usually `robots: { index: false }` when non-canonical |
| Owner / Admin / Auth | `robots: { index: false, follow: false }` |

### 12.2 Canonical strategy

| Page | Canonical |
| --- | --- |
| Institution | `https://{domain}/institutions/{slug}` |
| City hub | `/cities/{city}` |
| District hub | `/cities/{city}/{district}` |
| Type hub | `/institution-types/{type}` |
| City × type | `/cities/{city}/types/{type}` |
| District × type | `/cities/{city}/{district}/{type}` |
| Search matching a hub | Hub URL (not `/search?...`) |
| Paginated hubs | Self-canonical per page **or** page-1 canonical per SEO policy — pick one sitewide |
| Trailing slash / www / http | 301 to preferred host + slash policy |

### 12.3 Dynamic metadata fields

For institution and hubs, metadata must include at minimum:

- `title`, `description`  
- `alternates.canonical`  
- Open Graph title/description/image/url  
- Twitter card basics  
- `robots` aligned with publish + `isIndexable`  

JSON-LD is rendered in page content (not a separate route).

### 12.4 Sitemap & robots

- Sitemap includes only public indexable routes.  
- Disallow `/owner`, `/admin`, `/login`, `/register`, `/forgot-password`, `/verify-email`.

---

## 13. Rendering hints (by route)

| Route pattern | Default rendering |
| --- | --- |
| `/`, static trust pages | SSG/ISR |
| `/cities/**`, `/institution-types/**` | ISR + on-demand revalidation |
| `/institutions/[slug]` | ISR/SSR-with-cache + revalidate on update |
| `/search` | Dynamic |
| `/blog/**` | ISR |
| `/owner/**`, `/admin/**` | Dynamic, authenticated |
| `/login` etc. | Dynamic |

---

## 14. Middleware concerns (logical)

Not implementation — required behaviors:

| Concern | Routes |
| --- | --- |
| Auth gate | `/owner/*`, `/admin/*` |
| Role gate | `/admin/*` (moderator+) |
| Ownership gate | `/owner/*` institution-scoped actions |
| Redirect logged-in users | Away from `/login`/`/register` when appropriate |
| Legacy redirects | §10 aliases |

---

## 15. Route map summary

```text
PUBLIC
  / 
  /search
  /institutions
  /institutions/[slug]
  /cities
  /cities/[city]
  /cities/[city]/[district]
  /cities/[city]/types/[type]
  /cities/[city]/[district]/[type]
  /institution-types
  /institution-types/[type]
  /programs
  /programs/[program]
  /blog
  /blog/[slug]
  /about /contact /privacy /terms

AUTH
  /login /register /forgot-password /verify-email

OWNER
  /owner
  /owner/profile
  /owner/institution
  /owner/gallery
  /owner/programs
  /owner/leads
  /owner/settings

ADMIN
  /admin
  /admin/institutions
  /admin/users
  /admin/leads
  /admin/blog
  /admin/seo
  /admin/settings
  /admin/reports

FUTURE
  /compare /favorites /events /scholarships /universities /exams
```

---

## 16. Acceptance criteria

- [ ] All MVP public/owner/admin/auth routes resolvable under App Router groups  
- [ ] Institution canonical is `/institutions/[slug]`  
- [ ] Hub routes support SEO gates (no empty indexables)  
- [ ] Owner/Admin/Auth are `noindex`  
- [ ] Legacy aliases 301 to new paths  
- [ ] `generateMetadata` covers institution + hubs  
- [ ] `loading` / `error` / `not-found` boundaries defined per major segment  

---

## 17. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Engineering | | | ☐ |
| Product | | | ☐ |
| SEO | | | ☐ |

**Summary:** EduAtlas routing is Next.js App Router with **(public)**, **(auth)**, **(owner)**, **(admin)** groups; public SEO lives under `/institutions`, `/cities`, `/institution-types` (plus city/district×type hubs); private product surfaces under `/owner` and `/admin`; shared auth under `/login`–`/verify-email`; future routes reserved; legacy Turkish/short paths redirect to this contract.
