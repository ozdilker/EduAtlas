# EduAtlas — System Architecture

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | SYSTEM-ARCHITECTURE.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-009 |
| **Status** | Reference architecture for all future sprints |
| **Last updated** | 13 July 2026 |

---

## Document control

This document defines the **complete software architecture** of EduAtlas — Türkiye’s education ecosystem platform. It is the engineering reference for every future sprint.

| Related document | Role |
| --- | --- |
| `PRD.md` | Product scope |
| `DOMAIN-MODEL.md` | Business entities |
| `FIREBASE-ARCHITECTURE.md` | Firebase services & data |
| `SEO-ARCHITECTURE.md` | URL & rendering SEO constraints |
| `DATA-ACQUISITION.md` | Ingest pipelines |
| `INSTITUTION-PROFILE-SPECIFICATION.md` | Primary public page |
| `BUSINESS-MODEL.md` | Commercial constraints |
| `atlas.config.json` | Atlas CLI / templates binding |

**Non-goals:** Implementation code, library version pins as contracts, or infra account setup runbooks.

---

## 1. Purpose & scale

EduAtlas must support:

| Dimension | Target |
| --- | --- |
| Users | Millions of parents/students (mostly anonymous visitors) |
| Institutions | Hundreds of thousands |
| Indexable pages | Toward 1M+ |
| Traffic | 10M+ monthly visitors (organic-first) |

Architecture optimizes for **read-heavy public SEO traffic**, **secure write paths** for leads/claims, and **modular growth** (universities, marketplace, AI) without rewriting the core.

---

## 2. Architecture principles

| Principle | Meaning for EduAtlas |
| --- | --- |
| **Layered architecture** | Presentation → Application → Domain → Infrastructure → Firebase/External; dependencies point inward |
| **Feature-first organization** | Code grouped by domain feature (`institution`, `leads`, `seo`), not only by technical layer folders |
| **Composition over inheritance** | Prefer composable modules, hooks, and pure functions over deep class hierarchies |
| **Dependency injection** | Ports/adapters: domain does not import Firebase SDKs; infrastructure implements interfaces |
| **Domain-first** | `DOMAIN-MODEL.md` entities and rules drive APIs and UI states |
| **Scalable modules** | Features can deploy/evolve with clear public surfaces; optional packages |
| **Testability** | Domain and application logic unit-testable without emulators; infra tested with emulators/contracts |
| **Atlas CLI compatibility** | Project layout, feature scaffolds, and templates driven by Atlas CLI + `atlas.config.json` |

### 2.1 Dependency rule

```text
Apps / UI  →  Application (use cases)  →  Domain  ←  Infrastructure adapters
                      ↓                         ↑
                 Shared packages          Firebase / HTTP / Search
```

Domain never depends on Next.js, Firebase Admin, or React.

### 2.2 Atlas CLI compatibility

| Concern | Spec |
| --- | --- |
| Config | Root `atlas.config.json` points at templates directory |
| Templates | `EduAtlas-Templates` (or configured path) supply feature/app scaffolds |
| Scaffolding | CLI generates feature modules with standard ports, tests, and route stubs |
| Conventions | Naming, folder layout, and module manifests must remain CLI-readable |
| Non-breakage | Hand-written code must not invent parallel trees that CLI cannot extend |

Future Atlas modules (plugins, marketplace packs) register through the same module boundary.

---

## 3. Applications

### 3.1 Application catalog

| Application | Audience | Primary responsibility | MVP |
| --- | --- | --- | --- |
| **Public Website** | Parents, students, crawlers | Discovery, hubs, institution profiles, lead capture, SEO | Yes |
| **Admin Portal** | Moderators, admins, super admins | Catalog CRUD, claims, leads oversight, SEO overrides, users | Yes |
| **Institution Portal** | Institution owners | Profile edit, media, lead inbox, claim status | Yes |
| **Future Mobile App** | Parents / owners | Native discovery & lead / owner inbox | No |
| **Future Internal Dashboard** | Ops, data, growth | Deep analytics, acquisition pipelines, QA tooling | No |

### 3.2 Public Website

- Next.js App Router site on Firebase Hosting (or compatible).  
- Routes: home, search, city/district/type hubs, `/kurum/[slug]`, static trust pages, blog (when enabled).  
- Server-first rendering for SEO; client islands for forms, gallery, maps.  
- No privileged secrets in the browser.

### 3.3 Admin Portal

- Authenticated SPA or App Router segment (`/admin`).  
- Role-gated: Moderator ⊂ Administrator ⊂ Super Admin.  
- Uses Admin-capable APIs (Server Actions with admin session, or callable Functions).  
- Never relies on public Firestore rules alone for sensitive list queries.

### 3.4 Institution Portal

- Authenticated segment (`/panel` or `/kurum-panel`).  
- Scoped to approved `institutionOwners` institutions.  
- Lead inbox, profile fields allowlist, media upload UX.

### 3.5 Future Mobile App

- Consumes the same Application/Domain APIs (HTTP/callables).  
- Does not fork business rules.  
- Push via FCM when notifications module matures.

### 3.6 Future Internal Dashboard

- Heavier analytics (BigQuery), data acquisition ops, dedupe consoles.  
- May be a separate app package with stricter VPN/IAM later.

### 3.7 Monorepo shape (logical)

```text
apps/
  web/                 # Public + shared Next shell
  admin/               # or apps/web/(admin) route group — product choice
  institution-portal/  # or route group in web
packages/
  domain/
  application/
  ui/
  types/
  utils/
  firebase/
  config/
  validation/
  modules/*            # feature modules
atlas.config.json
```

Route groups inside a single Next app are acceptable for MVP **if** module boundaries remain clear.

---

## 4. High-level architecture

### 4.1 Layer diagram

```text
┌──────────────────────────────────────────────────────────┐
│                 Presentation Layer                        │
│  Next.js pages/layouts · Portals · UI package · Mobile UI │
└─────────────────────────────┬────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────┐
│                 Application Layer                         │
│  Use cases · workflows · DTOs · Server Actions orchestr.  │
└─────────────────────────────┬────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────┐
│                   Domain Layer                            │
│  Entities · value objects · domain services · policies    │
└─────────────────────────────┬────────────────────────────┘
                              │ ports
┌─────────────────────────────▼────────────────────────────┐
│               Infrastructure Layer                        │
│  Repositories · auth adapters · search · mail · storage   │
└─────────────────────────────┬────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Firebase Layer│   │ External Services│   │ Observability   │
│ Auth/FS/Storage│   │ Search, email, AI│   │ Logs, GA, APM   │
│ Functions/Host │   │ Maps, payments*  │   │ Crashlytics*    │
└───────────────┘   └─────────────────┘   └─────────────────┘
```

\* Future / optional.

### 4.2 Presentation Layer

- Renders views; collects input; triggers application use cases.  
- Owns routing, metadata, loading/error UI, accessibility.  
- Does not embed Firestore queries with business invariants.

### 4.3 Application Layer

- Use cases: `PublishInstitution`, `SubmitLead`, `ApproveClaim`, `SearchInstitutions`, `GenerateHubPage`.  
- Transactional workflows spanning multiple repositories.  
- Maps DTOs ↔ domain; enforces authorization at use-case boundary.

### 4.4 Domain Layer

- Pure model of institutions, leads, ownership, SEO index gates, quality rules.  
- No I/O.  
- Shared across all apps.

### 4.5 Infrastructure Layer

- Implements ports: `InstitutionRepository`, `LeadRepository`, `ObjectStorage`, `SearchIndex`, `Mailer`, `Clock`.  
- Firebase Admin/Client SDKs live here only.

### 4.6 Firebase Layer

- System of record and managed services per `FIREBASE-ARCHITECTURE.md`.

### 4.7 External Services

| Service | Use |
| --- | --- |
| Algolia / Meilisearch | Future full-text search |
| Transactional email | Lead/claim notifications |
| Maps provider | Directions / embeds |
| AI provider | Summaries, assist (future) |
| Payment provider | Premium billing (future) |
| Google Search Console / GA4 | Growth analytics |

---

## 5. Next.js architecture

### 5.1 App Router

- File-system routes for public SEO URLs matching `SEO-ARCHITECTURE.md`.  
- Route groups for `(public)`, `(admin)`, `(panel)` without affecting URLs when appropriate.  
- Parallel routes/interceptors optional for galleries/modals—non-essential for MVP.

### 5.2 Server Components (default)

Use for:

- Hub pages, institution profile content, blog articles  
- Data fetch for published catalog  
- Metadata and breadcrumbs  

Benefits: smaller client JS, crawler-friendly HTML.

### 5.3 Client Components

Use for:

- Lead form, claim form, gallery lightbox, map widgets  
- Favorites toggle, share buttons  
- Admin/portal interactive tables  

Boundary: leaf interactivity; pass serializable props from server parents.

### 5.4 Server Actions

Use for:

- Authenticated mutations from Admin/Institution portals (when session trusted)  
- Form posts that must stay on-server  

Rules:

- Validate with shared `validation` package.  
- Call application use cases—not raw Firestore from the action body beyond a thin adapter.  
- Revalidate tagged paths (institution slug, hubs) after publish.

Public anonymous lead submit may prefer **Cloud Functions callable/HTTP** for App Check + rate limiting consistency; Server Actions allowed if equivalently hardened.

### 5.5 Metadata API

- Per-route `generateMetadata` for titles, descriptions, canonical, Open Graph.  
- Institution and hub templates per SEO + Profile specs.  
- No client-only meta for indexable pages.

### 5.6 Rendering strategy

| Surface | Strategy | Rationale |
| --- | --- | --- |
| Home, trust pages | SSG / ISR | Stable |
| City / district / type hubs | ISR | Many pages; revalidate on supply change |
| Institution profile | ISR or SSR-with-cache | Freshness vs scale; on-demand revalidation on update |
| Search results | Dynamic / SSR | Query-dependent; `noindex` when needed |
| Admin / panel | Dynamic SSR + Auth | Private |
| Preview unpublished | Dynamic, `noindex`, auth | Ops |

**On-demand revalidation:** Application triggers path/tag revalidation when institution/hub publish state changes (from Server Action or Function webhook).

### 5.7 Caching tags (logical)

Examples: `institution:{id}`, `hub:city:{id}`, `hub:district-type:{id}:{typeId}`, `sitemap`.

---

## 6. Firebase in the system

| Service | System role |
| --- | --- |
| **Firestore** | System of record for domain collections |
| **Storage** | Media and private claim documents |
| **Authentication** | Owners, moderators, admins (+ future parents) |
| **Cloud Functions** | Invariants, webhooks, jobs, public hardened writes |
| **Hosting** | Serves Next.js output / rewrites |
| **Analytics (GA4)** | Product analytics complementing domain `analytics_*` |

Detailed collections, rules, and Functions: `FIREBASE-ARCHITECTURE.md`. This document defines **where** Firebase sits in the layered system—not field-level repetition.

---

## 7. Feature modules

Feature-first modules encapsulate UI slices, application use cases, and port interfaces. Infrastructure adapters may live in `packages/firebase` or module-specific infra folders.

### 7.1 Module catalog

| Module | Responsibility |
| --- | --- |
| **Institution** | Profile CRUD policies, publish lifecycle, public profile read model |
| **Search** | Query API, filters, ranking port, Firestore fallback adapter |
| **Location** | Cities, districts, geo helpers, hub location context |
| **Programs** | Program/course listings, future filters |
| **Leads** | Lead capture, status, attribution, owner inbox |
| **Users** | Profiles, account status, identity mapping |
| **Favorites** | Save institutions (auth or deferred) |
| **Content** | Static pages, announcements, facilities copy blocks |
| **Blog** | Editorial posts, indexing hooks |
| **SEO** | seoPages, metadata builders, sitemap, index gates, JSON-LD builders |
| **Notifications** | Email/FCM orchestration ports |
| **Analytics** | Event dictionary, server counters, reporting reads |
| **Administration** | Claim queue, moderation, system settings, user admin |

### 7.2 Module contract (logical)

Each module exposes:

- Domain types & policies  
- Application use cases  
- Optional UI widgets  
- Port interfaces  
- Test fixtures  

Modules must not import another module’s infrastructure—only domain/application façades.

---

## 8. Shared packages

| Package | Contents |
| --- | --- |
| **UI** | Design system primitives, layout shells, form controls, accessibility helpers |
| **Types** | Shared DTO/API types; cross-app contracts (not Firebase wire types leaking upward) |
| **Utilities** | Slug helpers, Turkish fold, dates, result/error types |
| **Firebase** | Client/admin initialization, repository implementations, emulators config |
| **Configuration** | Env schema, feature flags mapping, `atlas` config loaders |
| **Validation** | Zod (or equivalent) schemas for leads, institutions, claims—used by Actions & Functions |

Versioned internally in the monorepo; apps depend on packages, never the reverse.

---

## 9. Authentication & roles

### 9.1 Identity modes

| Mode | Auth | Capabilities |
| --- | --- | --- |
| **Anonymous visitor** | None | Browse published catalog; submit leads/contact via hardened endpoints |
| **Parent** (future) | Firebase Auth | Favorites, reviews, saved searches |
| **Institution Owner** | Auth + approved ownership | Portal edit; lead inbox |
| **Moderator** | Auth + role claim | Claim review, content moderation, limited catalog edits |
| **Administrator** | Auth + role claim | Full catalog, users, SEO overrides, settings |
| **Super Admin** | Auth + elevated claim | Admin grant/revoke, dangerous merges, system flags |

### 9.2 Authorization placement

1. **Custom claims** for coarse role.  
2. **Use-case checks** for institution scope (owner of X).  
3. **Firestore rules** as last-line public read / deny.  
4. **Admin SDK** paths for privileged list/query.

Parents remain anonymous in MVP for discovery/leads.

---

## 10. API boundaries

### 10.1 Public APIs

| Surface | Consumers | Examples |
| --- | --- | --- |
| Public HTTP / callables | Website, future mobile | `SubmitLead`, `SubmitContactRequest`, public search |
| Public read models | SSR | Get institution by slug; list hub institutions |

Characteristics: App Check, rate limits, no admin data, validated inputs.

### 10.2 Internal APIs

| Surface | Consumers | Examples |
| --- | --- | --- |
| Admin/portal callables or Server Actions | Authenticated portals | Approve claim, publish institution, update lead status |
| Job triggers | Scheduler / Pub/Sub | Recompute quality, rebuild sitemap |

Characteristics: AuthZ mandatory; audit logged for sensitive actions.

### 10.3 Server Actions

- In-process Next.js server mutations for portal UX.  
- Same validators and use cases as Functions where duplicated—prefer shared application package.  
- Not a substitute for Functions when work must run outside the web request (image pipeline, long SEO fan-out).

### 10.4 Cloud Functions

- Cross-cutting side effects and hardened public writes.  
- Background: storage finalize, Firestore triggers, schedulers.  
- HTTP webhooks for future billing/AI providers.

### 10.5 Boundary rule

```text
UI → Server Action or API client → Application use case → Port → Infrastructure
```

No “random Firestore writes” from React components.

---

## 11. Search

### 11.1 Search module responsibilities

- Accept query + filters (city, district, type, keywords).  
- Return ranked institution cards for UI and hub SSR.  
- Normalize Turkish input.  
- Enforce published-only for public.  
- Emit `SearchQuery` analytics events (privacy-safe).  
- Provide port `SearchProvider`.

### 11.2 Providers

| Provider | Phase |
| --- | --- |
| Firestore token/filter fallback | MVP |
| Meilisearch / Algolia / Typesense | Near-term |
| Hybrid (filters in FS, text external) | Optional |

Switching providers must not change Presentation contracts—only infrastructure binding.

---

## 12. Media

| Stage | Owner |
| --- | --- |
| Upload UI | Institution / Admin presentation |
| Temp storage | Infrastructure Storage adapter |
| Validation (type/size) | Application + Function |
| Optimization (variants) | Background Function |
| URL writeback | Institution repository update |
| CDN delivery | Firebase Storage / Hosting headers |

Private claim documents never served on public profiles. Align with Profile + Data Acquisition specs.

---

## 13. Background jobs

| Job | Trigger | Outcome |
| --- | --- | --- |
| **SEO generation** | Publish/unpublish / schedule | Hub `seoPages`, index flags, revalidation signals |
| **Image optimization** | Storage finalize | Variants + Firestore URLs |
| **Analytics aggregation** | Events / schedule | `analytics_*` rollups |
| **Notifications** | Lead/claim events | Email (FCM later) |
| **Scheduled sync** | Scheduler | Freshness checks, quality scores, broken links, sitemap |
| **Search index sync** | Institution write | Outbox → external index |

Jobs are **idempotent** and observable (structured logs + metrics).

---

## 14. AI (future)

AI modules plug in as application services behind ports—never as silent writers to published NAP fields.

| Capability | Behavior |
| --- | --- |
| Institution summaries | Draft → human/owner approve |
| SEO generation | Hub intro drafts with `aiGenerated` flag |
| Recommendations | “Nearby / similar” enhancement |
| Search assistant | Query understanding UX |
| Data acquisition assist | Candidates & extraction proposals |

Governance: `DATA-ACQUISITION.md` + SEO index gates. Secrets only in Functions/Secret Manager.

---

## 15. Observability

| Pillar | Practice |
| --- | --- |
| **Logging** | Structured JSON logs in Functions & server; correlation ids on leads/claims |
| **Monitoring** | Error rates, latency, queue lag, SSR cache hit ratio |
| **Analytics** | GA4 + server counters; event dictionary from Profile Spec |
| **Crash reporting** | Crashlytics (future) for client stability |
| **Alerting** | Spike in lead failures, Auth errors, Function timeouts |

PII redaction mandatory in logs.

---

## 16. Security architecture

| Control | Spec |
| --- | --- |
| **Authentication** | Firebase Auth for privileged apps; anonymous public browse |
| **Authorization** | Claims + use-case scope + rules defense-in-depth |
| **Validation** | Shared schemas on every write boundary |
| **Rate limiting** | Leads, contact, claim, auth-sensitive endpoints |
| **Input sanitization** | Strip HTML in free text; safe markdown policy if introduced |
| **App Check** | Public callables |
| **Secrets** | Never in client bundles |
| **KVKK** | Consent storage on leads; retention jobs |
| **CSRF / session** | Framework defaults for Server Actions; cookie security |

Security reviews required when adding marketplace/payments.

---

## 17. Deployment

### 17.1 Environments

| Environment | Purpose |
| --- | --- |
| **Development** | Local Next + Firebase emulators |
| **Preview** | Per-PR Hosting preview + staging project or channel |
| **Production** | Live project; protected promote |

### 17.2 CI/CD (logical pipeline)

```text
PR → lint/typecheck/unit → emulator integration (smoke)
   → preview deploy
main → staging deploy → prod promote (manual approval recommended)
```

Deployables: Hosting/web, Cloud Functions, Firestore rules/indexes, Storage rules.

### 17.3 Config

- Env via CI secrets + Firebase project config.  
- `packages/config` validates required vars at boot.

---

## 18. Scalability

| Target | Architectural response |
| --- | --- |
| **100k institutions** | Indexed queries; denormalized cards; external search; no N+1 SSR |
| **1M pages** | ISR + on-demand revalidation; hub generation gates; sharded sitemaps |
| **10M monthly visitors** | CDN caching; minimal per-request Firestore; edge-friendly pages; rate-limited writes |

Horizontal scale primarily via Firebase managed services + stateless Next instances/Functions. Avoid sticky server memory as source of truth.

---

## 19. Testing strategy (architecture-level)

| Layer | Test type |
| --- | --- |
| Domain | Unit tests for policies (publish gates, claim transitions) |
| Application | Use-case tests with in-memory fakes |
| Infrastructure | Emulator contract tests |
| UI | Component tests for forms/CTAs |
| E2E | Critical journeys J1–J3 from PRD on preview |

Atlas CLI scaffolds should include test stubs per feature module.

---

## 20. Extension points

### 20.1 Plugins

- Modules register optional UI slots (profile tabs, admin widgets) via a registry.  
- No core forks for university-only features—feature flags + modules.

### 20.2 Marketplace (future)

- Billing + entitlements module consumes Institution Premium flags.  
- Placement ads as SEO-safe labeled modules.

### 20.3 Future Atlas modules

- CLI-installed packs from `EduAtlas-Templates` / registry.  
- Must declare: routes contributed, collections touched, permissions required, feature flag key.

### 20.4 Stable extension surfaces

1. Domain events (InstitutionPublished, LeadCreated)  
2. SearchProvider / NotificationProvider / StorageProvider ports  
3. Profile section registry  
4. Admin navigation registry  

---

## 21. Cross-cutting read/write paths (examples)

### 21.1 Public institution view

```text
Request /kurum/{slug}
  → Next Server Component
  → GetInstitutionBySlug (application)
  → InstitutionRepository (Firebase)
  → SEO metadata + JSON-LD builders
  → HTML + client islands (form/gallery)
```

### 21.2 Lead submit

```text
Client form
  → Callable/Action SubmitLead
  → Validate + rate limit
  → Lead policy (domain)
  → LeadRepository + analytics increment
  → Notification port (async)
```

### 21.3 Claim approve

```text
Admin UI
  → ApproveClaim use case
  → Update institutionOwners + institution.claimStatus
  → Set custom claims
  → Audit log + notify owner
```

---

## 22. Decisions locked by this architecture

| ID | Decision |
| --- | --- |
| A-001 | Layered + feature modules; domain isolation from Firebase |
| A-002 | Next.js App Router server-first for SEO surfaces |
| A-003 | Firebase as primary backend per Firebase Architecture |
| A-004 | Three app surfaces: Public, Admin, Institution (mobile later) |
| A-005 | Public writes hardened via Functions/App Check where needed |
| A-006 | Search behind provider port |
| A-007 | Atlas CLI-compatible package/module layout |

---

## 23. Open decisions

1. Single Next app with route groups vs separate `apps/admin`.  
2. Lead create: Server Action vs Callable Function as primary.  
3. External search vendor selection.  
4. Multi-region Firebase vs regional + CDN only.  
5. Timing of parent Auth for favorites/reviews.

---

## 24. Sprint use guide

| Sprint type | How to use this doc |
| --- | --- |
| Feature build | Place work in a module; respect layers; add tests |
| Infra change | Update ports/adapters; keep domain stable |
| New app surface | Reuse application/domain; new presentation only |
| AI / marketplace | New module + ports; feature-flagged |

If a sprint needs to violate a principle, update this document first.

---

## 25. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Engineering lead | | | ☐ |
| Product | | | ☐ |
| Security | | | ☐ |

**Summary:** EduAtlas is a **layered, domain-first, feature-modular** system centered on a **Next.js public SEO application** plus **Admin** and **Institution** portals, backed by **Firebase**, with shared packages, hardened API boundaries, pluggable search/AI, and **Atlas CLI-compatible** extension points—built to scale to **hundreds of thousands of institutions** and **millions of users** without collapsing into an untestable monolith.
