# EduAtlas — Domain Model

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | DOMAIN-MODEL.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-003 |
| **Status** | Source of truth for data design |
| **Last updated** | 13 July 2026 |

---

## Document control

This document defines every **business entity** used by EduAtlas. It is the source of truth for:

| Consumer | Use of this model |
| --- | --- |
| Firestore | Collections, documents, references, indexes |
| API | Resources, payloads, validation |
| Admin Panel | CRUD screens and workflows |
| Institution Panel | Owned-resource editing and inboxes |
| Search | Filterable / searchable attributes |
| SEO | Hub and detail page entities (`SEOPage`, geography, type) |
| Analytics | Event dimensions and countable objects |

| Related document | Role |
| --- | --- |
| `PRD.md` | Product scope; MVP vs deferred behavior |
| `PROJECT-DASHBOARD.md` | Milestone and release framing |
| Firebase Architecture (Sprint-001) | Persistence and security mapping |

### MVP vs catalog completeness

The domain includes entities required for a complete education marketplace model. **PRD MVP** activates a subset. Each entity states **MVP activation**: `Active`, `Partial`, or `Reserved`.

Reserved entities still have stable identities and relationships so Firestore/API can grow without renaming.

---

## 1. Domain overview

EduAtlas domain centers on **Institutions** located in **Cities/Districts**, classified by **InstitutionType** and **Category**, offering **Programs** and **Courses**, discovered via **Search** and **SEOPage** hubs, and converting interest into **Leads** / **ContactRequests**. **Users** act as **Admins** or **InstitutionOwners**.

```text
Geography          Catalog                 Demand                Identity
─────────          ───────                 ──────                ────────
City               InstitutionType         SearchQuery           User
  └─ District      Category                Lead                    ├─ Admin
                   Institution             ContactRequest          └─ InstitutionOwner
                     ├─ InstitutionBranch  Review (reserved)
                     ├─ Program            Campaign (reserved)
                     ├─ Course
                     └─ Teacher (reserved)
                   SEOPage
                   Announcement / BlogPost (reserved)
```

---

## 2. Shared concepts

### 2.1 Canonical lifecycle (catalog & content)

Unless an entity defines a specialized lifecycle, publishable entities use:

| State | Meaning |
| --- | --- |
| **Draft** | Being prepared; not public |
| **Pending Review** | Submitted for admin moderation |
| **Published** | Public and eligible for indexation / search (if applicable) |
| **Archived** | Soft-retired; not public; retained for history |
| **Deleted** | Soft-deleted tombstone or hard-deleted per retention policy |

**Standard transitions**

```text
Draft → Pending Review → Published → Archived → Deleted
Draft → Published                    (admin fast-path)
Published → Draft                    (unpublish / revert)
Published → Archived
Any non-Deleted → Deleted            (admin; with rules)
Deleted → (restore to Archived/Draft) (admin only, if soft-delete)
```

### 2.2 Identity & audit fields (all entities)

Every persisted entity includes conceptual audit fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable unique identifier |
| `createdAt` | Creation timestamp |
| `updatedAt` | Last mutation timestamp |
| `createdByUserId` | Actor (nullable for public forms) |
| `updatedByUserId` | Last editor (nullable) |

### 2.3 Visibility classes

| Class | Meaning |
| --- | --- |
| **Public** | Visible on public web when parent/entity is Published |
| **Authenticated-Institution** | Visible to InstitutionOwners of the related institution |
| **Admin** | Visible to Admins only |
| **Private** | Visible only to owning user (and Admin) |
| **System** | Internal; not shown in UI except diagnostics |

---

## 3. Entity catalog

---

### 3.1 Institution

**MVP activation:** Active  

**Purpose**  
Canonical educational organization profile. Primary unit of discovery, SEO, claims, and lead conversion.

**Owner**  
- Platform owns the record until claimed.  
- After approved claim, **InstitutionOwner** has editorial ownership; **Admin** retains platform ownership (override, unpublish, transfer).

**Relationships**

| Direction | Relationship | Entity |
| --- | --- | --- |
| has one (primary) | classified as | InstitutionType |
| has many (optional MVP+) | tagged with | Category |
| located in | belongs to | City, District |
| has many | | InstitutionBranch |
| has many | | Program |
| has many | | Course |
| has many | | Teacher |
| has many | | Lead |
| has many | | ContactRequest (institution-scoped) |
| has many | | Review |
| has many | | Campaign |
| has one | represented by | SEOPage (type=`institution`) |
| has many | owned via | InstitutionOwner |

**Lifecycle**  
Draft → Pending Review → Published → Archived → Deleted  

Also tracks **claim substate** (orthogonal to publish lifecycle):

| Claim state | Meaning |
| --- | --- |
| `unclaimed` | No approved owner |
| `pending` | At least one open ownership claim |
| `claimed` | At least one approved InstitutionOwner |
| `revoked` | Prior claim removed; treat as unclaimed for editing |

**Required fields**

| Field | Notes |
| --- | --- |
| `name` | Display name |
| `slug` | Unique public slug |
| `primaryTypeId` | FK → InstitutionType |
| `cityId` | FK → City |
| `districtId` | FK → District |
| `address` | Street-level text |
| `shortDescription` | Parent-facing summary |
| `lifecycleStatus` | Draft…Deleted |
| `claimStatus` | unclaimed/pending/claimed/revoked |
| `contactPhone` **or** `contactEmail` | At least one required to publish |

**Optional fields**

| Field | Notes |
| --- | --- |
| `contactPhone`, `contactEmail` | Whichever not used as the required contact |
| `whatsappNumber` | |
| `websiteUrl` | |
| `logoUrl`, `coverImageUrl` | |
| `programsSummary` | Free-text offerings blurb |
| `ageOrLevelFocus` | e.g., anaokulu ages, YKS, general English |
| `locationNotes` | |
| `secondaryCategoryIds` | Reserved; MVP uses primary type only |
| `isPremium` | Reserved for premium tier |
| `publishedAt` | |

**Business rules**

1. Publish only when required fields are complete and `cityId`/`districtId` are consistent (district belongs to city).  
2. `slug` immutable after first publish unless Admin forces change with redirect rule.  
3. Name changes by InstitutionOwner should be Admin-approved (recommended rule).  
4. Unpublished / Draft / Archived / Deleted never appear in public search or public SEO sitemaps.  
5. One primary InstitutionType per institution (MVP).

**Visibility**  
Public when Published; else Admin (+ InstitutionOwner may preview own Draft if allowed).

---

### 3.2 InstitutionBranch

**MVP activation:** Partial (model now; UI optional if single-location institutions dominate launch)

**Purpose**  
Physical or operational location under a parent Institution (multi-campus).

**Owner**  
Parent **Institution** (edited by Admin or InstitutionOwner of parent).

**Relationships**

| Direction | Relationship | Entity |
| --- | --- | --- |
| belongs to | many-to-one | Institution |
| located in | | City, District |
| may have many | | Program, Course (branch-scoped, optional) |
| may receive | | Lead (optional `branchId`) |

**Lifecycle**  
Same canonical lifecycle; cannot be Published if parent Institution is not Published.

**Required fields**  
`institutionId`, `name`, `cityId`, `districtId`, `address`, `lifecycleStatus`

**Optional fields**  
`phone`, `email`, `whatsappNumber`, `slug`, `lat`, `lng`, `isPrimaryBranch`

**Business rules**

1. Every Institution has conceptually at least one location: either implicit on Institution **or** one primary Branch.  
2. If Branches exist, exactly one `isPrimaryBranch=true` recommended.  
3. Deleting Institution cascades archive of Branches.

**Visibility**  
Public when Published and parent Published.

---

### 3.3 InstitutionType

**MVP activation:** Active  

**Purpose**  
Controlled vocabulary for the six launch verticals (and future types).

**Owner**  
Admin (system taxonomy).

**Relationships**  
Referenced by Institution (`primaryTypeId`); drives SEO type hubs; filters SearchQuery.

**Lifecycle**  
Draft → Published → Archived (Deleted rare; prefer Archive).

**Required fields**  
`code`, `nameTr`, `nameEn`, `slug`, `lifecycleStatus`, `sortOrder`

**Optional fields**  
`description`, `icon`, `schemaOrgSubtype`

**Business rules**

1. Seed set (MVP): `private_school`, `dershane`, `etut_merkezi`, `language_school`, `kindergarten`, `preschool`.  
2. `code` and `slug` unique and stable.  
3. Archiving a type forbidden while Published institutions still reference it (or require reassignment).

**Visibility**  
Public for Published types.

---

### 3.4 Program

**MVP activation:** Partial (structured programs encouraged; free-text summary on Institution acceptable for launch)

**Purpose**  
Named offering track under an Institution (e.g., “Okul Öncesi Tam Gün”, “YKS Sayısal”).

**Owner**  
Institution (via InstitutionOwner) / Admin.

**Relationships**  
belongs to Institution; optional Branch; has many Courses; may link Categories.

**Lifecycle**  
Canonical lifecycle; visible publicly only when Published **and** parent Institution Published.

**Required fields**  
`institutionId`, `name`, `lifecycleStatus`

**Optional fields**  
`branchId`, `description`, `ageMin`, `ageMax`, `levelLabel`, `categoryIds`, `sortOrder`

**Business rules**  
Program cannot outlive Institution; archive with parent.

**Visibility**  
Public when Published under Published Institution.

---

### 3.5 Course

**MVP activation:** Partial  

**Purpose**  
Specific course unit within a Program or Institution (e.g., “General English A1”, “Matematik Etüt”).

**Owner**  
Institution / Admin.

**Relationships**  
belongs to Institution; optional Program; optional Branch; optional Teachers.

**Lifecycle**  
Canonical lifecycle.

**Required fields**  
`institutionId`, `name`, `lifecycleStatus`

**Optional fields**  
`programId`, `branchId`, `description`, `scheduleSummary`, `durationSummary`, `teacherIds`

**Business rules**  
If `programId` set, program must belong to same institution.

**Visibility**  
Public when Published under Published Institution.

---

### 3.6 City

**MVP activation:** Active  

**Purpose**  
Türkiye ili (province/city) geography node for filtering, ownership of districts, and SEO city hubs.

**Owner**  
Admin / system reference data.

**Relationships**  
has many Districts; has many Institutions; has one SEOPage (city hub).

**Lifecycle**  
Published / Archived (Draft uncommon; seed as Published).

**Required fields**  
`nameTr`, `slug`, `plateCode` (or equivalent stable code), `lifecycleStatus`

**Optional fields**  
`nameEn`, `seoIntroHtml`, `sortOrder`, `isPriority` (İstanbul, Ankara, İzmir, …)

**Business rules**  
`slug` unique; plate/code unique; cannot archive while published institutions reference unless migrated.

**Visibility**  
Public when Published.

---

### 3.7 District

**MVP activation:** Active  

**Purpose**  
İlçe within a City; local SEO and search filter.

**Owner**  
Admin / system reference data.

**Relationships**  
belongs to City; has many Institutions; has one SEOPage (district hub).

**Lifecycle**  
Published / Archived.

**Required fields**  
`cityId`, `nameTr`, `slug`, `lifecycleStatus`

**Optional fields**  
`nameEn`, `seoIntroHtml`

**Business rules**

1. `slug` unique within city (globally unique slug recommended: `istanbul-kadikoy`).  
2. District’s `cityId` must match Institution’s `cityId`.

**Visibility**  
Public when Published.

---

### 3.8 Category

**MVP activation:** Partial (taxonomy reserved; MVP relies primarily on InstitutionType)

**Purpose**  
Flexible tags beyond primary type (e.g., “STEM”, “Montessori”, “IB”, “Yabancı dil ağırlıklı”).

**Owner**  
Admin.

**Relationships**  
many-to-many with Institution, Program; may appear on SEOPage facets later.

**Lifecycle**  
Canonical lifecycle.

**Required fields**  
`nameTr`, `slug`, `lifecycleStatus`

**Optional fields**  
`nameEn`, `description`, `parentCategoryId` (tree), `institutionTypeHints`

**Business rules**  
Unique `slug`; soft-archive over delete.

**Visibility**  
Public when Published.

---

### 3.9 Teacher

**MVP activation:** Reserved  

**Purpose**  
Educator profile associated with an Institution (trust/content enrichment).

**Owner**  
Institution / Admin.

**Relationships**  
belongs to Institution; optional Courses; optional Reviews (about teacher — future).

**Lifecycle**  
Canonical lifecycle.

**Required fields**  
`institutionId`, `fullName`, `lifecycleStatus`

**Optional fields**  
`title`, `bio`, `photoUrl`, `specializations`, `courseIds`

**Business rules**  
Not shown publicly unless Published; PRD MVP does not require Teacher UI.

**Visibility**  
Public when Published; else Institution + Admin.

---

### 3.10 Review

**MVP activation:** Reserved (explicitly out of PRD MVP)

**Purpose**  
Parent/student rating and commentary about an Institution (or Branch).

**Owner**  
Submitting User (content); Admin (moderation); Institution cannot edit stars/text.

**Relationships**  
belongs to Institution; optional Branch; authored by User (or anonymous token — future policy).

**Lifecycle**  
Draft → Pending Review → Published → Archived → Deleted  
Institution may **flag**; Admin moderates.

**Required fields**  
`institutionId`, `rating` (1–5), `body`, `lifecycleStatus`, `authorDisplayName`

**Optional fields**  
`userId`, `branchId`, `title`, `moderationNotes`

**Business rules**

1. One active review per user per institution (recommended).  
2. Published reviews affect public page only when feature is activated.  
3. Until activation, do not render or index.

**Visibility**  
Public when Published **and** feature flag on; else Admin.

---

### 3.11 Campaign

**MVP activation:** Reserved (advertising / promotions)

**Purpose**  
Time-bound promotion for an Institution (discount message, open day, featured boost metadata).

**Owner**  
Institution (create request) / Admin (approve & inventory).

**Relationships**  
belongs to Institution; optional SEOPage placement; optional premium flag.

**Lifecycle**  
Draft → Pending Review → Published → Archived → Deleted  
Also `startsAt` / `endsAt` scheduling window.

**Required fields**  
`institutionId`, `title`, `startsAt`, `endsAt`, `lifecycleStatus`

**Optional fields**  
`body`, `ctaLabel`, `ctaUrl`, `budgetHints`, `placementType` (`organic_badge`, `paid_slot` — future)

**Business rules**  
Public only when Published and now ∈ [startsAt, endsAt]; paid placement requires future billing entities.

**Visibility**  
Public when active; Institution sees own; Admin sees all.

---

### 3.12 Lead

**MVP activation:** Active  

**Purpose**  
Primary conversion object: parent/student **information request** about an Institution (PRD §10).

**Owner**  
- Created by anonymous public visitor (no parent account in MVP).  
- **Visible/manageable** by InstitutionOwners when institution is claimed.  
- Always visible to Admin.  
- EduAtlas retains platform custody of PII under privacy policy.

**Relationships**  
belongs to Institution; optional Branch; optional Program/Course interest; optional attributed SearchQuery / SEOPage.

**Lifecycle (specialized)**

| State | Meaning |
| --- | --- |
| `new` | Submitted |
| `read` | Opened by institution or admin |
| `contacted` | Marked contacted |
| `closed` | Done / dismissed |
| `spam` | Abuse |

Transitions: `new → read → contacted → closed`; any → `spam`; Admin may reopen `spam → new` rarely.

**Required fields**  
`institutionId`, `fullName`, `phone`, `role` (parent/student/other), `message`, `consentAcceptedAt`, `status`

**Optional fields**  
`email`, `preferredContactTime`, `branchId`, `programId`, `courseId`, `sourceSeoPageId`, `sourceSearchQueryId`, `utm_*`, `ipHash`, `userAgentHash`

**Business rules**

1. Consent mandatory; store timestamp + policy version.  
2. Rate-limit creation by IP/device.  
3. Unclaimed institution leads: Admin inbox; InstitutionOwner gains access upon claim approval (historical leads included).  
4. Institution may set `read|contacted|closed|spam`; cannot delete hard (Admin only / retention job).

**Visibility**  
Authenticated-Institution (own) + Admin; never Public.

---

### 3.13 ContactRequest

**MVP activation:** Active (distinct from Lead)

**Purpose**  
Non-lead or cross-cutting contact intents: platform contact form, partnership, press, claim support, correction requests.

**Owner**  
Admin (inbox). Submitter has no account requirement.

**Relationships**  
optional `institutionId` (e.g., “report incorrect info”); optional `userId` if logged in.

**Lifecycle**  
`new` → `in_progress` → `resolved` → `closed`; or `spam`.

**Required fields**  
`type` (`general`, `partnership`, `correction`, `claim_help`, `other`), `fullName`, `email` **or** `phone`, `message`, `status`, `consentAcceptedAt`

**Optional fields**  
`institutionId`, `userId`, `subject`

**Business rules**

1. **Do not** treat ContactRequest as a substitute for Lead when the CTA is “request info from institution” — that creates **Lead**.  
2. Correction requests may spawn Admin tasks to edit Institution.  
3. Claim help may link to InstitutionOwner application flow.

**Visibility**  
Admin; Private to submitter only if accounts exist later.

---

### 3.14 User

**MVP activation:** Active  

**Purpose**  
Authenticated identity record for Admins and InstitutionOwners. Parents/students do **not** require User accounts in MVP.

**Owner**  
The user owns their profile; Admin may suspend.

**Relationships**  
may be Admin; may be InstitutionOwner (one or more); may author Review/BlogPost later.

**Lifecycle**  
`invited` → `active` → `suspended` → `deleted`

**Required fields**  
`authProviderUid` (or equivalent), `email`, `displayName`, `accountStatus`

**Optional fields**  
`phone`, `locale`, `lastLoginAt`

**Business rules**

1. Email unique.  
2. Suspension blocks Institution Panel and Admin access.  
3. Deletion follows retention/KVKK policy (anonymize vs remove).

**Visibility**  
Private + Admin.

---

### 3.15 InstitutionOwner

**MVP activation:** Active  

**Purpose**  
Ownership/claim link between a User and an Institution. Encodes claim workflow and permissions for Institution Panel.

**Owner**  
Created by User (claim request); approved by Admin; represents ownership rights thereafter.

**Relationships**  
belongs to User; belongs to Institution; grants management over Branches/Programs/Courses/Leads of that institution.

**Lifecycle (claim lifecycle)**

| State | Meaning |
| --- | --- |
| `draft` | Started but not submitted |
| `pending_review` | Awaiting Admin |
| `published` / **`approved`** | Active ownership (use `approved`) |
| `rejected` | Denied |
| `archived` | Voluntary leave / replaced |
| `deleted` / **`revoked`** | Admin forced removal |

Recommended stored status enum: `pending_review` | `approved` | `rejected` | `revoked`.

**Required fields**  
`userId`, `institutionId`, `status`, `requestedAt`

**Optional fields**  
`titleAtInstitution`, `verificationNotes`, `documentUrls`, `reviewedByAdminId`, `reviewedAt`, `rejectionReason`, `isPrimaryOwner`

**Business rules**

1. MVP: one **primary** approved owner per institution; additional owners reserved.  
2. Approving owner sets Institution.`claimStatus=claimed`.  
3. Revoking last owner sets Institution.`claimStatus=unclaimed` (or `revoked`).  
4. Pending claim sets Institution.`claimStatus=pending`.  
5. User may not hold conflicting pending claims abusively (rate-limit / Admin review).

**Visibility**  
Admin + involved User; public site shows only “claimed” badge, not owner PII.

---

### 3.16 Admin

**MVP activation:** Active  

**Purpose**  
Platform operator role bound to a User.

**Owner**  
Super-admin / platform (bootstrap).

**Relationships**  
belongs to User; can moderate all catalog, claims, leads, content.

**Lifecycle**  
`active` ↔ `suspended`; Deleted removes capability.

**Required fields**  
`userId`, `role` (`admin`, `super_admin`), `status`

**Optional fields**  
`permissionsOverlay` (future fine-grained RBAC)

**Business rules**

1. At least one `super_admin` must remain.  
2. Admins cannot approve their own institution ownership if also claimants without dual-control (recommended).  
3. All publish/delete of taxonomy and SEO overrides require Admin.

**Visibility**  
Admin-only directory of admins.

---

### 3.17 SearchQuery

**MVP activation:** Active (analytics + optional personalization later)

**Purpose**  
Captured search intent for analytics, relevance tuning, and optional attribution on Leads.

**Owner**  
System (created automatically).

**Relationships**  
optional links to City, District, InstitutionType, Category; may attribute Lead.

**Lifecycle**  
Append-only log; not Draft/Published. Retention → Archived/Deleted by jobs.

**Required fields**  
`occurredAt`, `rawQuery` (may be empty if filter-only)

**Optional fields**  
`cityId`, `districtId`, `institutionTypeId`, `categoryId`, `resultCount`, `sessionId`, `normalizedQuery`

**Business rules**  
Do not store raw PII in query text intentionally; scrub obvious phone/email patterns when possible.

**Visibility**  
Admin / Analytics; System.

---

### 3.18 SEOPage

**MVP activation:** Active  

**Purpose**  
First-class indexable hub or detail SEO document: home sections, city, district, type, city+type, district+type, institution canonical metadata overrides.

**Owner**  
System-generated from geography/type/institution; Admin may override copy.

**Relationships**  
references City / District / InstitutionType / Institution as applicable; linked in internal graph; listed in sitemap when indexable.

**Lifecycle**  
Draft → Published → Archived → Deleted  

Indexability flag separate: `isIndexable` false for thin/empty hubs.

**Required fields**  
`pageType`, `slug`, `title`, `metaDescription`, `lifecycleStatus`, `isIndexable`

**Optional fields**  
`h1`, `introHtml`, `canonicalPath`, `ogImageUrl`, `schemaJson`, `cityId`, `districtId`, `institutionTypeId`, `institutionId`, `generatedFrom` 

**pageType enum (MVP)**  
`home`, `city`, `district`, `type`, `city_type`, `district_type`, `institution`, `static` (about/privacy/terms)

**Business rules**

1. Empty hubs (`institutionCount=0`) must not be `isIndexable=true`.  
2. Institution SEOPage mirrors Institution publish state.  
3. Unique `canonicalPath`.  
4. Internal linking requirements from PRD must be satisfiable via these records + live queries.

**Visibility**  
Public when Published and indexable (or published noindex for intentional cases); Admin edits always.

---

### 3.19 Announcement

**MVP activation:** Reserved  

**Purpose**  
Platform-wide or institution-scoped notice (maintenance, enrollment season banner).

**Owner**  
Admin (platform); Institution for own announcements when feature enabled.

**Relationships**  
optional Institution; optional Campaign link.

**Lifecycle**  
Canonical + schedule window.

**Required fields**  
`title`, `body`, `lifecycleStatus`, `startsAt`

**Optional fields**  
`endsAt`, `institutionId`, `priority`, `audience` (`public`, `owners`, `admins`)

**Visibility**  
Per `audience` and schedule.

---

### 3.20 BlogPost

**MVP activation:** Reserved  

**Purpose**  
Editorial content for SEO/brand (guides: “Kadıköy’de anaokulu seçimi”).

**Owner**  
Admin / editorial User.

**Relationships**  
optional Category, City, InstitutionType links; SEOPage type `static` or dedicated blog route.

**Lifecycle**  
Canonical lifecycle with Pending Review.

**Required fields**  
`title`, `slug`, `body`, `lifecycleStatus`, `authorUserId`

**Optional fields**  
`excerpt`, `coverImageUrl`, `cityId`, `institutionTypeId`, `publishedAt`

**Business rules**  
Unique slug; noindex drafts; reserved from MVP launch criteria unless explicitly pulled in.

**Visibility**  
Public when Published.

---

## 4. Relationship map

### 4.1 Core structural relationships

```text
City
 └─ has many → District
      └─ has many → Institution

InstitutionType
 └─ classifies many → Institution

Category
 └─ tags many → Institution (M:N)
 └─ tags many → Program (M:N)

Institution
 ├─ has many → InstitutionBranch
 ├─ has many → Program
 │    └─ has many → Course
 ├─ has many → Course
 ├─ has many → Teacher
 ├─ has many → Lead
 ├─ has many → Review
 ├─ has many → Campaign
 ├─ has many → Announcement
 └─ has one  → SEOPage (institution)

User
 ├─ has one  → Admin (0..1)
 └─ has many → InstitutionOwner
      └─ owns → Institution
```

### 4.2 Demand & discovery relationships

```text
SearchQuery ──attributes──▶ Lead (optional)
SEOPage     ──landed on──▶ Lead (optional)
ContactRequest ──optional──▶ Institution

SEOPage
 ├─ city hub      → City
 ├─ district hub  → District
 ├─ type hub      → InstitutionType
 ├─ city+type     → City + InstitutionType
 ├─ district+type → District + InstitutionType
 └─ institution   → Institution
```

### 4.3 Narrative examples

| Statement | Model |
| --- | --- |
| Institution has many Branches | `InstitutionBranch.institutionId` |
| InstitutionOwner owns Institution | `InstitutionOwner` approved link |
| Institution owns Programs/Courses | child FKs to Institution |
| District belongs to City | `District.cityId` |
| Lead belongs to Institution | `Lead.institutionId` |

---

## 5. Ownership rules

| Asset | Platform (Admin) | InstitutionOwner | Public visitor |
| --- | --- | --- | --- |
| Institution record | Ultimate ownership; create/publish/archive/delete | Editorial ownership when `approved` | Read Published |
| Branches / Programs / Courses | Full | Full for owned institution | Read Published |
| City / District / InstitutionType / Category | Exclusive | None | Read Published |
| SEOPage overrides | Exclusive | Suggest-only (future) | Read |
| Lead PII | Custody + full access | Access for owned institution | Create only |
| ContactRequest | Exclusive inbox | None (unless about their institution — future) | Create only |
| User account | Suspend/delete | Self profile | N/A |
| InstitutionOwner link | Approve/reject/revoke | Request; view own | CTA only |
| Review / Campaign / Blog / Teacher | Moderate | Manage own where allowed | Per feature flags |
| SearchQuery | Read analytics | None | Implicit create |

**Golden rules**

1. **InstitutionOwner owns Institution content; Admin owns the platform record.**  
2. **Institution owns Branches, Programs, Courses, Teachers.**  
3. **Admin owns geography, taxonomy, SEO hubs, Admin role grants.**  
4. **Leads are platform-custodied PII shared with owners under consent.**  
5. **Unclaimed institutions are platform-operated listings.**

---

## 6. Lifecycle reference

### 6.1 Catalog entities

Applies to: Institution, InstitutionBranch, Program, Course, Teacher, Category, InstitutionType (limited), SEOPage, Announcement, BlogPost, Campaign, Review.

| From \ To | Draft | Pending Review | Published | Archived | Deleted |
| --- | --- | --- | --- | --- | --- |
| Draft | — | Owner/Admin submit | Admin fast-publish | Admin | Admin |
| Pending Review | Admin return | — | Admin approve | Admin | Admin |
| Published | Admin unpublish | Rare | — | Owner*/Admin | Admin |
| Archived | Admin restore | — | Admin restore+publish | — | Admin |
| Deleted | Restore policy | — | — | — | — |

\*InstitutionOwner may archive own Programs/Courses/Branches if permitted; may not delete Institution.

### 6.2 Lead lifecycle

`new → read → contacted → closed` (+ `spam` side state).

### 6.3 InstitutionOwner lifecycle

`pending_review → approved | rejected` → `revoked`/`archived`.

### 6.4 User / Admin lifecycle

`invited/active/suspended/deleted` independent of catalog publish states.

---

## 7. Permissions matrix

Legend: **C** create · **E** edit · **P** publish · **A** archive · **D** delete · **R** read  
`—` none · `●` yes · `◐` limited / own-scoped · `○` create-only (public form)

| Entity | Public | InstitutionOwner | Admin |
| --- | --- | --- | --- |
| Institution | R (published) | E ◐ P— A◐ D— | C E P A D |
| InstitutionBranch | R | C E P A D ◐ | C E P A D |
| InstitutionType | R | — | C E P A D |
| Program | R | C E P A D ◐ | C E P A D |
| Course | R | C E P A D ◐ | C E P A D |
| City | R | — | C E P A D |
| District | R | — | C E P A D |
| Category | R | — | C E P A D |
| Teacher | R* | C E P A D ◐ | C E P A D |
| Review | R* | flag only | C† E P A D |
| Campaign | R* | C E + submit | C E P A D |
| Lead | ○ create | R E status ◐ | R E A D |
| ContactRequest | ○ create | — | R E A D |
| User | — | E self | E A D |
| InstitutionOwner | ○ request | R own | C E P(approve) A D |
| Admin | — | — | C E A D |
| SearchQuery | ○ implicit | — | R D(retention) |
| SEOPage | R | — | C E P A D |
| Announcement | R* | C E ◐* | C E P A D |
| BlogPost | R* | — | C E P A D |

\*When feature activated / Published.  
†Admin may seed reviews only for testing; normal creation is end-user when feature ships.

### 7.1 Permission narratives

| Action | Who |
| --- | --- |
| Create Institution | Admin (MVP); owners do not self-create arbitrary new orgs without claim flow |
| Edit Institution core fields | InstitutionOwner (approved) + Admin |
| Publish Institution | Admin (MVP); optional later: owner submit → Admin publish |
| Archive Institution | Admin; owner may request |
| Delete Institution | Admin only |
| Approve claim | Admin |
| Create Lead | Public |
| Mark Lead contacted | InstitutionOwner / Admin |

---

## 8. Cross-cutting business invariants

1. **Referential geography:** `Institution.districtId` must belong to `Institution.cityId`.  
2. **Publish completeness:** Institution publish blocked without PRD required fields.  
3. **Claim vs edit:** Only `approved` InstitutionOwner (or Admin) edits institution-owned children.  
4. **Search eligibility:** Only `Published` Institutions (and published children as needed).  
5. **SEO eligibility:** `SEOPage.isIndexable` requires non-thin content and live published targets.  
6. **PII minimization:** SearchQuery and analytics hashes preferred over raw IP storage.  
7. **Soft delete preference:** Archive before Delete for Institutions and SEOPages to preserve URLs/redirect strategy.  
8. **Turkish market defaults:** `nameTr` authoritative for geography/taxonomy public labels in MVP.

---

## 9. Analytics mapping (entity → metrics)

| Metric theme | Entities |
| --- | --- |
| Traffic / SEO | SEOPage, SearchQuery, Institution (page views) |
| Supply | Institution, InstitutionType, City, District, InstitutionOwner |
| Demand | Lead, ContactRequest, SearchQuery |
| Engagement (future) | Review, Campaign, BlogPost, Announcement |
| Quality | Institution field completeness, Lead spam rate, claim pending time |

---

## 10. Future extensions (reserved)

The following capabilities must **not** break existing entity IDs or ownership rules when introduced.

### 10.1 AI recommendations

| Extension | Domain touchpoints |
| --- | --- |
| Recommended institutions | New `Recommendation` entity referencing User/session + Institution; inputs from SearchQuery + Lead |
| Embedding fields | Optional `searchEmbedding` on Institution/Program (storage detail in architecture) |
| Explainer copy | Generated fields on SEOPage marked `aiGenerated=true` with Admin override |

### 10.2 Advertising

| Extension | Domain touchpoints |
| --- | --- |
| Ad inventory | Extend Campaign.`placementType`; new `AdSlot`, `AdCharge` |
| Billing | New `BillingAccount` linked to InstitutionOwner |
| Auction/boost | Rank signals separate from organic SEOPage content |

### 10.3 Premium institutions

| Extension | Domain touchpoints |
| --- | --- |
| Tier | `Institution.isPremium`, `premiumUntil` |
| Entitlements | Badge on public page; richer media; priority in sort (disclosed) |
| Sales | Admin-granted or billing-granted |

### 10.4 Events

| Extension | Domain touchpoints |
| --- | --- |
| Open days / webinars | New `Event` owned by Institution; optional Branch |
| RSVP | May create Lead or `EventRegistration` |

### 10.5 Scholarships

| Extension | Domain touchpoints |
| --- | --- |
| Offerings | New `Scholarship` owned by Institution; link Program |
| Applications | May create Lead subtype or `ScholarshipApplication` |

**Extension rule:** Add new entities; do not overload Lead for all future intents without a `leadKind` discriminator agreed in a PRD revision.

---

## 11. Entity index (quick reference)

| Entity | MVP | Primary owner | Public? |
| --- | --- | --- | --- |
| Institution | Active | Admin + InstitutionOwner | Yes if Published |
| InstitutionBranch | Partial | Institution | Yes if Published |
| InstitutionType | Active | Admin | Yes |
| Program | Partial | Institution | Yes if Published |
| Course | Partial | Institution | Yes if Published |
| City | Active | Admin | Yes |
| District | Active | Admin | Yes |
| Category | Partial | Admin | Yes |
| Teacher | Reserved | Institution | Future |
| Review | Reserved | Author / Admin | Future |
| Campaign | Reserved | Institution / Admin | Future |
| Lead | Active | Platform custody | No |
| ContactRequest | Active | Admin | No |
| User | Active | Self / Admin | No |
| InstitutionOwner | Active | User + Admin | Badge only |
| Admin | Active | Platform | No |
| SearchQuery | Active | System | No |
| SEOPage | Active | Admin / System | Yes if Published |
| Announcement | Reserved | Admin / Institution | Future |
| BlogPost | Reserved | Admin | Future |

---

## 12. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| Engineering | | | ☐ |
| Data / Architecture | | | ☐ |

**Once signed, this domain model is the binding vocabulary for Firestore, API, panels, search, SEO, and analytics.** Schema physical design must map to these entities without silently merging distinct concepts (especially **Lead** vs **ContactRequest**).
