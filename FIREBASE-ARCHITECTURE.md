# EduAtlas — Firebase Architecture

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | FIREBASE-ARCHITECTURE.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-008 |
| **Status** | Binding backend architecture specification |
| **Last updated** | 13 July 2026 |

---

## Document control

This document defines how EduAtlas uses **Firebase / Google Cloud** as the primary backend. It maps `DOMAIN-MODEL.md` entities to Firestore, Auth, Storage, Functions, and related services.

| Related document | Role |
| --- | --- |
| `DOMAIN-MODEL.md` | Business entities & permissions |
| `PRD.md` | MVP product behavior |
| `SEO-ARCHITECTURE.md` | URL / indexable page scale |
| `DATA-ACQUISITION.md` | Ingest, verification, media |
| `INSTITUTION-PROFILE-SPECIFICATION.md` | Read models for `/kurum/{slug}` |
| `BUSINESS-MODEL.md` | Leads, premium (post-MVP billing outside core) |

**Non-goals:** Application source code, exact SDK snippets, or vendor account setup runbooks.

---

## 1. Architecture overview

```text
                    ┌─────────────────────────────┐
   Parents (web)    │  Firebase Hosting + SSR/SSG │
   Institutions     │  (Next.js or equivalent)    │
   Admins           └──────────────┬──────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
     Firebase Auth          Cloud Functions         Firestore
     (owners/admins)        (triggers/HTTP/tasks)   (system of record)
            │                      │                      │
            │                      ├─ Storage processing  │
            │                      ├─ SEO / slug / stats  │
            │                      └─ Lead side-effects   │
            ▼                      ▼                      ▼
        Custom claims         Cloud Scheduler      Firebase Storage
        roles                 FCM (future)         media & claim docs
                                   │
                                   ▼
                         Analytics / Crashlytics
                         External search (future)
```

**System of record:** Cloud Firestore.  
**Public SEO HTML:** Hosting + server rendering layer reading Firestore (or precomputed snapshots).  
**Secrets / admin writes:** Never from anonymous clients for privileged fields.

---

## 2. Services

| Service | Role in EduAtlas | MVP |
| --- | --- | --- |
| **Cloud Firestore** | Primary database: catalog, users, leads, SEO pages, ops | Yes |
| **Firebase Auth** | Institution owners & admins; optional parent accounts later | Yes |
| **Firebase Storage** | Logos, galleries, videos, claim documents, blog media | Yes |
| **Cloud Functions** | Slugs, leads, images, SEO hooks, stats, notifications | Yes |
| **Firebase Hosting** | Web app / edge routing to SSR | Yes |
| **Cloud Scheduler** | Freshness jobs, sitemap rebuild triggers, stale checks | Yes |
| **Cloud Messaging (FCM)** | Push to owners/admins | Future |
| **Google Analytics (GA4)** | Product/SEO funnel analytics | Yes |
| **Crashlytics** | Client crash reporting | Future |
| **Cloud Logging / Monitoring** | Ops observability | Yes |
| **Secret Manager** (GCP) | API keys for email/search | Yes as needed |

### 2.1 Environment strategy

| Environment | Firebase project | Data |
| --- | --- | --- |
| `dev` | Isolated | Synthetic / small seed |
| `staging` | Isolated | Anonymized or subset production-like |
| `prod` | Production | Live catalog |

No cross-environment Auth tokens. CI deploys Functions/Hosting per project.

---

## 3. Collection catalog

Unless noted, collections are **root-level**. Subcollections used where fan-out or security isolation benefits.

### 3.1 Summary

| Collection | Domain entity | MVP |
| --- | --- | --- |
| `institutions` | Institution | Yes |
| `branches` | InstitutionBranch | Partial |
| `institutionTypes` | InstitutionType | Yes |
| `cities` | City | Yes |
| `districts` | District | Yes |
| `programs` | Program | Partial |
| `categories` | Category | Partial |
| `users` | User | Yes |
| `institutionOwners` | InstitutionOwner | Yes |
| `admins` | Admin | Yes |
| `leads` | Lead | Yes |
| `contactRequests` | ContactRequest | Yes |
| `favorites` | (Profile favorites) | Optional |
| `reviews` | Review | Future |
| `announcements` | Announcement | Future / sparse |
| `blogPosts` | BlogPost | Future / Partial |
| `seoPages` | SEOPage | Yes |
| `campaigns` | Campaign | Future |
| `analytics` | Aggregates / rollups | Yes (system) |
| `systemSettings` | Config | Yes |
| `searchIndexJobs` (optional) | Outbox for search sync | Future-ready |
| `verificationEvents` (optional sub/root) | Verification history | Recommended |

---

## 4. Collection specifications

For each collection: purpose, ID strategy, relationships, indexes, ownership, read/write, growth.

---

### 4.1 `institutions`

**Purpose:** Canonical educational organization profiles; public discovery unit.

**Document ID strategy**

- Autogenerated Firestore ID as immutable primary key.  
- `slug` unique field for URLs (`/kurum/{slug}`).  
- Optional `legacySlugs[]` for redirects.

**Relationships**

- `primaryTypeId` → `institutionTypes`  
- `cityId` → `cities`  
- `districtId` → `districts`  
- `categoryIds[]` → `categories`  
- Owners via `institutionOwners`  
- Children: `branches`, `programs`, `leads`, `reviews` by `institutionId`  
- `seoPages` where `pageType=institution` and `institutionId`

**Indexes (representative)**

| Fields | Use |
| --- | --- |
| `lifecycleStatus` ASC + `cityId` ASC + `updatedAt` DESC | City listings |
| `lifecycleStatus` + `districtId` + `primaryTypeId` | District×type hubs |
| `lifecycleStatus` + `primaryTypeId` + `cityId` | City×type |
| `slug` ASC | Canonical lookup (unique enforced in Functions) |
| `claimStatus` + `updatedAt` | Ops queues |
| `qualityScore` DESC + `lifecycleStatus` | Outreach priority |
| `geohash` + `lifecycleStatus` | Nearby (if used) |

**Ownership:** Platform; editorial by approved owners.

**Read:** Public client may read documents where `lifecycleStatus == published` (fields filtered—see Security). Owners/Admin read fuller docs.

**Write:** Admin create/update/publish; Owner update allowlisted fields; never anonymous write.

**Growth:** 100k+ documents; hot reads on published; mitigate with CDN/SSR cache and denormalized hub snapshots.

---

### 4.2 `branches`

**Purpose:** Campuses / locations under an institution.

**Document ID:** Autogenerated; `institutionId` required.

**Relationships:** N:1 `institutions`; geo → `cities`/`districts`.

**Indexes:** `institutionId` + `lifecycleStatus`; `districtId` + `lifecycleStatus`.

**Ownership:** Parent institution (owner/admin).

**Read:** Public if `published` and parent published (enforce in rules via parent flag denormalized `parentPublished`).

**Write:** Owner of parent / Admin.

**Growth:** Low multiple of institutions (≈1–5×).

---

### 4.3 `institutionTypes`

**Purpose:** Controlled taxonomy (dershane, anaokulu, …).

**Document ID:** Stable `code` (e.g., `dershane`) **or** autogen with unique `code` field—prefer **code as ID** for readability.

**Relationships:** Referenced by institutions, seoPages, programs.

**Indexes:** `lifecycleStatus` + `sortOrder`.

**Ownership:** Admin only.

**Read:** Public published types.

**Write:** Admin only.

**Growth:** Tens, not thousands.

---

### 4.4 `cities`

**Purpose:** Türkiye il reference + SEO city hubs metadata.

**Document ID:** Prefer stable `slug` (`ankara`) or plate code; slug-as-ID recommended for routing.

**Relationships:** 1:N `districts`; 1:N institutions; seoPages.

**Indexes:** `lifecycleStatus` + `nameTr`; `isPriority`.

**Ownership:** Admin / system seed.

**Read:** Public published.

**Write:** Admin.

**Growth:** ~81.

---

### 4.5 `districts`

**Purpose:** İlçe reference + district hubs.

**Document ID:** Autogen **or** composite-friendly id; unique (`cityId`, `slug`). Prefer autogen + unique index fields.

**Relationships:** N:1 `cities`; institutions; seoPages.

**Indexes:** `cityId` + `slug`; `cityId` + `lifecycleStatus`; `slug` global if globally unique slugs used.

**Ownership:** Admin.

**Read:** Public published.

**Write:** Admin.

**Growth:** ~1k.

---

### 4.6 `programs`

**Purpose:** Structured offerings under institutions.

**Document ID:** Autogenerated.

**Relationships:** `institutionId`; optional `branchId`; categories.

**Indexes:** `institutionId` + `lifecycleStatus`; `lifecycleStatus` + `categoryIds` (array-contains) future.

**Ownership:** Institution owner / Admin.

**Read:** Public if published + parent published (`parentPublished` denormalized).

**Write:** Owner / Admin.

**Growth:** 0–50× institutions over time; universities explode counts—partition by institution queries.

---

### 4.7 `categories`

**Purpose:** Flexible tags beyond primary type.

**Document ID:** `slug` as ID or autogen + unique slug.

**Relationships:** M:N via institution `categoryIds[]`.

**Indexes:** `lifecycleStatus` + `sortOrder`.

**Ownership:** Admin.

**Read:** Public published.

**Write:** Admin.

**Growth:** Hundreds.

---

### 4.8 `users`

**Purpose:** Auth-linked profiles for owners/admins (parents optional later).

**Document ID:** **Firebase Auth UID** (1:1).

**Relationships:** `admins`, `institutionOwners`, future reviews.

**Indexes:** `email`; `accountStatus` + `updatedAt`.

**Ownership:** Self (limited) + Admin.

**Read:** Self; Admin list via Admin SDK only (avoid client enumeration).

**Write:** Self allowlisted profile fields; Admin status changes via Admin SDK / Functions.

**Growth:** Tens of thousands eventual; not millions of parents in MVP.

---

### 4.9 `institutionOwners`

**Purpose:** Claim / ownership links User ↔ Institution.

**Document ID:** Autogenerated; unique constraint (`institutionId`, `userId`) enforced in Functions.

**Relationships:** `userId`, `institutionId`; review metadata.

**Indexes:** `institutionId` + `status`; `userId` + `status`; `status` + `requestedAt` (claim queue).

**Ownership:** Created by user request; approved by Admin.

**Read:** Involved user; Admin; **not** public (public only sees claim badge on institution).

**Write:** User creates pending; Admin approves/rejects/revokes; user cannot self-approve.

**Growth:** ≈ claimed institutions (start << 100k).

---

### 4.10 `admins`

**Purpose:** Admin role binding.

**Document ID:** Auth UID (1:1 with admin users).

**Relationships:** `users`.

**Indexes:** `status` + `role`.

**Ownership:** Super-admin bootstrap.

**Read/Write:** Admin SDK / privileged Functions only—**not** broad client reads.

**Growth:** Small (< 50).

---

### 4.11 `leads`

**Purpose:** Parent/student information requests (conversion PII).

**Document ID:** Autogenerated.

**Relationships:** `institutionId`; optional `branchId`, `programId`, attribution ids.

**Indexes:** `institutionId` + `status` + `createdAt` DESC; `status` + `createdAt` (admin); `createdAt` DESC.

**Ownership:** Platform custody; visible to owners of claimed institution.

**Read:** Owner (own institution); Admin; **never** public/anonymous list.

**Write:** Anonymous/authenticated **create** via Cloud Function (preferred) with App Check + rate limits; owners update `status` only; Admin full.

**Growth:** High write volume relative to catalog; partition mentally by institution; consider TTL/archive subcollections later.

**PII note:** Minimize client exposure; prefer Callable/HTTPS Function for create.

---

### 4.12 `contactRequests`

**Purpose:** Platform contact / corrections / partnership (not institution leads).

**Document ID:** Autogenerated.

**Relationships:** optional `institutionId`, `userId`.

**Indexes:** `status` + `createdAt`; `type` + `status`.

**Ownership:** Admin inbox.

**Read:** Admin only.

**Write:** Public create via Function; Admin status updates.

**Growth:** Low–medium.

---

### 4.13 `favorites`

**Purpose:** Parent save-for-later institutions.

**Document ID:** Prefer `{uid}_{institutionId}` if Auth parents exist; else anonymous device store stays **client-only** until accounts ship.

**Relationships:** `userId`, `institutionId`.

**Indexes:** `userId` + `createdAt`.

**Ownership:** User.

**Read/Write:** Owner user only.

**Growth:** Users × favorites; MVP may defer collection if local-only favorites.

---

### 4.14 `reviews` (future)

**Purpose:** Ratings/comments.

**Document ID:** Autogenerated.

**Relationships:** `institutionId`, optional `userId`.

**Indexes:** `institutionId` + `lifecycleStatus` + `createdAt`; moderation queues `lifecycleStatus` + `createdAt`.

**Ownership:** Author content; Admin moderation.

**Read:** Public published only.

**Write:** Auth user create → pending; Admin publish; institution flag via Function.

**Growth:** Potentially large; subcollection `institutions/{id}/reviews` is an acceptable alternate design for query locality.

---

### 4.15 `announcements`

**Purpose:** Platform or institution notices.

**Document ID:** Autogenerated.

**Indexes:** `audience` + `lifecycleStatus` + `startsAt`; `institutionId` + `lifecycleStatus`.

**Read:** Per audience + schedule.  
**Write:** Admin; institution for own (when enabled).  
**Growth:** Small.

---

### 4.16 `blogPosts`

**Purpose:** Editorial SEO content.

**Document ID:** Autogenerated; unique `slug`.

**Indexes:** `lifecycleStatus` + `publishedAt` DESC; `slug`.

**Read:** Public published.  
**Write:** Admin/editor.  
**Growth:** Hundreds–thousands.

---

### 4.17 `seoPages`

**Purpose:** First-class hub & metadata documents for L0–L6 (+ future).

**Document ID:** Prefer deterministic IDs from route key, e.g. hash of `canonicalPath`, or autogen + unique `canonicalPath`.

**Relationships:** optional `cityId`, `districtId`, `institutionTypeId`, `institutionId`.

**Indexes:** `pageType` + `isIndexable` + `lifecycleStatus`; `canonicalPath`; `cityId` + `pageType`; `institutionId` + `pageType`.

**Ownership:** System-generated + Admin overrides.

**Read:** Public published; SSR uses Admin SDK or public fields.

**Write:** Functions (generation) + Admin; not owners (MVP).

**Growth:** Toward **1M pages** potential (hubs + institutions + programs + blog). Institution pages may be **derived** from `institutions` with `seoPages` holding overrides only—see denormalization. Architecture must allow either:

- **A:** One `seoPages` doc per indexable URL, or  
- **B:** Hubs in `seoPages`; institution SEO fields embedded on `institutions` + virtual page generation.

**Recommendation:** Hybrid—**hubs & static in `seoPages`**; institution canonical SEO fields on `institutions` with optional override doc.

---

### 4.18 `campaigns`

**Purpose:** Promotions / future ads boosts.

**Document ID:** Autogenerated.

**Indexes:** `institutionId` + `lifecycleStatus`; `lifecycleStatus` + `startsAt` + `endsAt`.

**Read:** Public when active; owner own; Admin all.  
**Write:** Owner submit; Admin publish.  
**Growth:** Moderate.

---

### 4.19 `analytics`

**Purpose:** **Server-side rollups** (not GA4 replacement): institution counters, daily aggregates.

**Document ID strategies**

- `institutions/{id}` mirror counters doc: `analytics_institutions/{institutionId}`  
- Time buckets: `analytics_daily/{yyyyMMdd}`  
- Hub counters: `analytics_hubs/{seoPageId}`

**Relationships:** Points at institutions/hubs.

**Ownership:** System (Functions only).

**Read:** Admin; owners may read own institution counters.

**Write:** Functions only (FieldValue increments).

**Growth:** Controlled cardinality; avoid unbounded event dumps in Firestore (export raw events to BigQuery later).

---

### 4.20 `systemSettings`

**Purpose:** Feature flags, publish thresholds, slug rules version, maintenance mode.

**Document ID:** Named docs (`general`, `seo`, `leads`, `featureFlags`).

**Read:** Public may read non-sensitive flags via Hosting config bootstrap; sensitive settings Admin only.

**Write:** Admin / CI.  
**Growth:** Tiny.

---

## 5. Document design principles

### 5.1 Embedding vs references

| Pattern | Use when |
| --- | --- |
| **Reference IDs** | Cities, types, owners, cross-entity links |
| **Embed snapshots** | Card/list denormalization: `cityName`, `districtName`, `typeName`, `typeSlug` on institution |
| **Subcollections** | High-volume children per parent (optional for leads/reviews) |
| **Avoid deep nesting** | No `cities/{id}/districts/{id}/institutions/{id}` as sole path—hurts fan-out queries |

### 5.2 Denormalization strategy

Denormalize **read-mostly display fields** onto institutions and seo hubs:

- Geo names/slugs, type label/slug  
- `parentPublished` on children  
- `claimStatus`, `verificationLevel`, `qualityScore`  
- Cover/logo URLs  
- Approximate `leadCount` / `viewCount` via `analytics_*`

**Recompute via Functions** on source change (city rename rare; type rename cascades carefully).

### 5.3 Immutable fields

| Field | Rule |
| --- | --- |
| Document ID | Immutable |
| `createdAt`, `createdBy` | Immutable after create |
| Institution `slug` after first publish | Immutable except Admin+redirect Function |
| Auth UID keys | Immutable |
| Lead consent timestamp / policy version | Immutable |

### 5.4 Computed fields

| Field | Producer |
| --- | --- |
| `qualityScore` (+ components) | Scheduled/triggered Function |
| `slug` (initial) | Function on create |
| `geohash` | Function when geo set |
| `searchTokens` / `nameFolded` | Function for Firestore fallback search |
| Hub `institutionCount` | Function on publish/unpublish |
| `isIndexable` on seoPages | Function from supply gates |

### 5.5 Audit fields

All mutable business docs:

- `createdAt`, `updatedAt`  
- `createdByUserId`, `updatedByUserId` (nullable for system/public forms)  
- Optional `schemaVersion`

Privileged changes append to `auditLogs` (Admin SDK) for publish/merge/claim decisions—recommended separate collection for compliance.

### 5.6 Soft delete

| Approach | Spec |
| --- | --- |
| Prefer | `lifecycleStatus = deleted \| archived` + `deletedAt` |
| Hard delete | Rare; Admin only; after merge or legal erasure |
| Queries | Default exclude deleted/archived from public |
| Storage | Soft-delete paths; lifecycle rules for claim docs |

---

## 6. Search architecture

### 6.1 Phased approach

| Phase | Engine | Notes |
| --- | --- | --- |
| MVP | **Firestore fallback** | Prefix/token fields + filters on city/district/type |
| Near-term | **Meilisearch** or **Algolia** | Full-text Turkish, typo tolerance |
| Sync | Functions outbox → indexer | On institution write |

### 6.2 Firestore fallback

Maintain on `institutions`:

- `nameFolded` (Turkish-normalized lowercase)  
- `searchKeywords[]` (tokens)  
- Filters: `lifecycleStatus`, `cityId`, `districtId`, `primaryTypeId`

Limitations: weak relevance, cost on large fan-out—acceptable for MVP with pagination.

### 6.3 External index document (logical)

Projected fields: id, slug, name, type, city, district, claimStatus, qualityScore, geohash, updatedAt.

**Do not** index PII leads.

### 6.4 Future Algolia / Meilisearch

- One index `institutions_public`  
- Optional `programs` index later  
- Secured API keys: search-only on client; admin key in Functions  
- `searchIndexJobs` collection as delivery outbox with retries

---

## 7. Geo architecture

| Concept | Storage |
| --- | --- |
| **Coordinates** | `location: { geopoint: GeoPoint, geohash: string, accuracy?: string }` on institution/branch |
| **City / District** | Relational IDs (source of truth for hubs) |
| **Bounding box** | Optional precomputed hub bbox in `seoPages` / city docs for map UX |
| **Nearby search** | Geohash prefix queries in Firestore MVP; external search geo filters later |

**Rules**

- City/district IDs drive SEO URLs; lat/lng optional for MVP publish.  
- Nearby module on profile uses district filter first; geohash when density requires.

---

## 8. Storage architecture

### 8.1 Bucket layout (logical paths)

```text
gs://{project}-media/
  institutions/{institutionId}/logo/{file}
  institutions/{institutionId}/gallery/{file}
  institutions/{institutionId}/videos/{file}
  institutions/{institutionId}/documents/{file}   # private claim docs
  blog/{postId}/{file}
  users/{uid}/uploads/{file}                      # constrained
  tmp/{uid}/{file}                                # short TTL
```

### 8.2 Access

| Path | Public read | Write |
| --- | --- | --- |
| logo / gallery / blog | Yes (published only—enforce via finalized paths post-moderation) | Owner/Admin via Rules + token |
| documents (claim proofs) | **No** | Owner upload; Admin read |
| videos | Conditional | Owner/Admin |

Prefer: upload to `tmp/` → Function validates/optimizes → moves to public path → writes URL on Firestore.

### 8.3 Image optimization

Cloud Function on finalize: resize variants (e.g., 64/256/1200), WebP/AVIF, strip risky EXIF, update institution media array.

### 8.4 Quotas

Per-institution gallery caps (free vs premium) enforced in Functions.

---

## 9. Security model

### 9.1 Principals

| Principal | Auth | Notes |
| --- | --- | --- |
| **Anonymous** | None | Public catalog reads; lead create via Function |
| **Parent** | Optional future Auth | Favorites; reviews |
| **Institution Owner** | Auth + approved `institutionOwners` | Panel |
| **Admin** | Auth + `admins` doc + custom claim `role=admin` | Ops |

Custom claims set **only** via Admin SDK in Functions on claim approve / admin grant.

### 9.2 Rules philosophy

1. Default deny.  
2. Public reads limited to published catalog fields.  
3. PII collections (`leads`, `contactRequests`, claim documents) **no public list**.  
4. Privileged writes through **Cloud Functions** when rules cannot safely express invariants (slug uniqueness, claim approve, lead rate limit).  
5. App Check enforced on public write endpoints.

### 9.3 Permission matrix (Firestore)

| Collection | Anonymous | Owner | Admin |
| --- | --- | --- | --- |
| institutions (published) | R (public fields) | R; W allowlist if owner | R/W |
| institutions (non-published) | — | R if owner | R/W |
| branches/programs published | R | R/W own | R/W |
| types/cities/districts/categories | R published | — | R/W |
| users | — | R/W self | R/W via Admin SDK |
| institutionOwners | — | R own; C pending | R/W |
| admins | — | — | Admin SDK |
| leads | C via Function | R/W status own inst | R/W |
| contactRequests | C via Function | — | R/W |
| favorites | — | R/W own | R |
| seoPages published | R | — | R/W |
| analytics | — | R own inst | R |
| systemSettings public flags | R limited | — | R/W |
| reviews published (future) | R | flag | R/W |

Storage rules mirror: public media readable; private docs owner/admin.

---

## 10. Cloud Functions

### 10.1 Catalog

| Function | Trigger | Purpose |
| --- | --- | --- |
| `onInstitutionWrite` | Firestore | Slug ensure, folded name, denormalize, search outbox, quality recompute enqueue |
| `generateSlug` | Callable / onCreate | Unique slug generation + collision retry |
| `processLeadCreate` | HTTPS/Callable | Validate, consent, rate limit, write lead, notify |
| `onLeadCreated` | Firestore | Email/FCM hooks; analytics increment |
| `processContactRequest` | HTTPS/Callable | Platform inbox create |
| `claimRequest` / `claimReview` | Callable | Owner request; Admin approve → claims + custom claims |
| `optimizeImage` | Storage finalize | Variants + URL writeback |
| `generateSeoPage` | Firestore / scheduled | Create/update hub seoPages; supply gates; counts |
| `rebuildSitemap` | Scheduler | Emit sitemap artifacts to Storage/Hosting |
| `recomputeStatistics` | Scheduler / events | analytics_* rollups |
| `notificationHooks` | events | Email now; FCM future |
| `dedupeAssist` | Callable/Admin | Confidence scoring assist |
| `qualityScoreJob` | Scheduler | Batch stale scores |
| `brokenLinkJob` | Scheduler | Soft warnings on websites |

### 10.2 Lead processing specifics

- Server-side validation matching PRD.  
- Store `ipHash`, `userAgentHash`, policy version.  
- If unclaimed → admin notification path.  
- If claimed → owner email + panel badge counters.

### 10.3 SEO generation

- On institution publish: ensure district×type and city×type pages exist/indexable.  
- On last institution unpublished: demote hub `isIndexable`.  
- Never invent thin pages.

### 10.4 Idempotency

All event-driven Functions use idempotency keys / document generation guards for retries.

---

## 11. Hosting & rendering

| Concern | Spec |
| --- | --- |
| Hosting | Firebase Hosting fronts web app |
| SEO | SSR/SSG/ISR for `/`, hubs, `/kurum/{slug}`—crawlers see content |
| Private apps | `/admin`, `/panel` client apps with Auth |
| Cache | CDN cache public pages; purge/revalidate on publish Function |

Firestore is not queried directly from Googlebot as the sole HTML source.

---

## 12. Messaging, Analytics, Crashlytics

| Service | Use |
| --- | --- |
| **FCM (future)** | Owner new-lead push; admin claim queue |
| **GA4** | Profile events per Institution Profile Spec |
| **Crashlytics (future)** | Mobile/web stability if SPA density increases |
| **BigQuery export (recommended later)** | Firestore + GA for heavy analytics |

---

## 13. Scalability targets

| Target | Design response |
| --- | --- |
| **100k institutions** | Root collection; composite indexes; CDN’d SSR; external search offload |
| **1M pages** | Deterministic seoPages for hubs; avoid storing useless empty hubs; sitemap index sharding |
| **10M monthly visitors** | Edge cache; read-heavy denormalization; minimize per-request Firestore roundtrips on public pages; rate-limit writes |

### 13.1 Cost / performance controls

- Public pages should not perform N+1 client Firestore reads.  
- Prefer single institution get by slug via SSR data layer.  
- Hub pages use precomputed lists or paginated queries with cursors.  
- Counter documents instead of `count()` on every request.  
- Archive old leads to cold storage/BigQuery after retention window.

### 13.2 Write hotspots

- Popular institution analytics increments → sharded counters if needed.  
- Lead bursts → Function queue / task queue.

---

## 14. Backups & recovery

### 14.1 Export strategy

| Asset | Method | Cadence |
| --- | --- | --- |
| Firestore | Scheduled export to GCS (managed export) | Daily prod |
| Storage | Versioning + GCS backup/replication | Continuous + periodic |
| Auth | Regular user export / Identity Platform backup practices | Periodic |
| System settings | Included in Firestore export | With DB |

### 14.2 Retention

- Soft-deleted institutions retained per legal/product policy.  
- Lead PII retention window documented (KVKK)—purge jobs scheduled.

### 14.3 Recovery

| Scenario | Response |
| --- | --- |
| Accidental delete | Restore from daily export to recovery project; selective import |
| Bad Function migration | Roll back Functions; restore collection export |
| Ransomware / region issue | Multi-region Storage; Firestore multi-region recommended for prod |

Disaster recovery runbook owned by engineering; quarterly restore drill recommended.

---

## 15. Extensibility

| Extension | Firebase impact |
| --- | --- |
| **Universities** | New types; denser `programs`; possibly `faculties` collection; university schema on seo |
| **Scholarships** | New `scholarships` collection referenced by institutions |
| **Events** | `events` collection + FCM reminders |
| **AI** | Tasks collection for proposals; store `aiGenerated` flags; Vertex/external calls from Functions only |
| **Marketplace / billing** | Prefer Stripe/iyzico + webhook Functions; `billingAccounts` collection—do not overload `leads` |
| **Courses** | `courses` collection parallel to programs |
| **Teachers** | `teachers` under institution |

**Extension rule:** Add collections; do not overload `institutions` with unbounded nested maps.

---

## 16. Cross-cutting standards

| Topic | Spec |
| --- | --- |
| Time | Store UTC timestamps; display `Europe/Istanbul` |
| IDs | String Firestore IDs; Auth UID for users |
| Money (future) | Integer minor units + currency `TRY` |
| Localization | TR content fields primary (`nameTr` on taxonomy) |
| App Check | Required on public callables |
| Emulators | Local Auth/Firestore/Functions/Storage for CI |

---

## 17. MVP build priority (architecture sequence)

1. Auth + `users` / `admins` / custom claims  
2. Taxonomy: `cities`, `districts`, `institutionTypes`  
3. `institutions` + Storage logos  
4. `seoPages` hubs + Hosting SSR routes  
5. `institutionOwners` claim flow  
6. `leads` via Function  
7. Scheduler: sitemap + quality  
8. Search: Firestore fallback → external index  

---

## 18. Open decisions

1. Institution SEO: embedded fields vs always-on `seoPages` row.  
2. Leads as root collection vs `institutions/{id}/leads` subcollection.  
3. Meilisearch vs Algolia vs Typesense for Turkish.  
4. Firestore regional vs multi-region for prod.  
5. Parent Auth timing for favorites/reviews.

---

## 19. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Engineering | | | ☐ |
| Product | | | ☐ |
| Security / Privacy | | | ☐ |

**Summary:** EduAtlas runs on **Firestore as system of record**, **Auth for owners/admins**, **Storage for media**, **Functions for invariants (slugs, leads, SEO, images, stats)**, **Hosting for SEO-capable web**, and **Scheduler for freshness**—designed for **100k institutions**, **~1M pages**, and **10M monthly visitors** via denormalization, CDN/SSR, gated public writes, and a pluggable search path (Firestore → Meilisearch/Algolia).
