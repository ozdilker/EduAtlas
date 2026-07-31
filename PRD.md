# EduAtlas — Product Requirements Document (PRD)

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | PRD.md |
| **Version** | 2.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-002 |
| **Status** | Binding for MVP implementation |
| **Market** | Türkiye |
| **Release target** | 15 August 2026 |
| **Last updated** | 13 July 2026 |

---

## Document control

This PRD is the **primary reference for all future implementation**. If a feature is not specified here, it is not in MVP scope unless this document is explicitly revised.

| Related document | Role |
| --- | --- |
| `PROJECT-DASHBOARD.md` | Project status, milestone, risks |
| Domain Model (Sprint-001) | Entities and relationships |
| Firebase Architecture (Sprint-001) | Technical system boundaries |
| SEO Strategy detail (this PRD § SEO) | Organic growth requirements |

---

## 1. Executive summary

EduAtlas is a web platform that helps parents and students **discover, compare, and contact** educational institutions across Türkiye. Institutions receive structured public profiles, claim ownership of those profiles, and capture inbound **lead requests** from interested families.

The first launch focuses on six institution categories:

| Category (EN) | Category (TR) |
| --- | --- |
| Private schools | Özel okullar |
| Course centers | Dershaneler |
| Study centers | Etüt merkezleri |
| Language schools | Dil okulları |
| Kindergartens | Anaokulları |
| Preschools | Kreş / okul öncesi |

MVP is a **SEO-first directory + lead generation** product: searchable institution listings, rich institution pages, geographic and type landing pages, an institution panel for claimed profiles, and an admin panel for operations.

---

## 2. Mission

EduAtlas helps parents discover, compare, and contact educational institutions across Türkiye — starting with private schools, dershaneler, etüt merkezleri, language schools, kindergartens, and preschool institutions.

---

## 3. Primary users

### 3.1 Parents

Primary demand-side users. They search by city, district, and institution type; compare profiles; and submit information requests on behalf of a child or family.

**Needs**

- Find nearby options that match age/level and institution type
- See trustworthy, comparable information in one place
- Contact institutions without hunting through social media DMs

### 3.2 Students

Secondary demand-side users (especially older students evaluating dershane, etüt, or language schools). They use the same discovery and contact flows as parents, with optional self-identification on lead forms.

**Needs**

- Fast filtering by location and type
- Clear program / offering signals on institution pages
- Simple way to request information or a callback

### 3.3 Educational institutions

Supply-side users: owners, principals, admissions, or marketing staff. They claim profiles, keep information current, and respond to leads.

**Needs**

- Appear in relevant local and category searches
- Control profile accuracy after claim approval
- Receive and manage parent/student inquiries

### 3.4 Platform administrators

Internal EduAtlas operators. They manage the catalog, moderate claims, oversee leads for unclaimed institutions, and maintain data quality.

**Needs**

- Create and edit institution records at scale
- Approve or reject claim requests
- Monitor lead volume, spam, and catalog health

---

## 4. Product goals

Goals are measurable. Numeric targets below are **MVP launch / first-90-days baselines** and may be refined in Release Planning without changing feature scope.

### 4.1 Launch readiness goals (must be true at go-live)

| Goal ID | Goal | Measure |
| --- | --- | --- |
| G-01 | Useful national catalog for launch categories | ≥ **500** published institutions across target types |
| G-02 | Coverage in priority cities | Institutions live in ≥ **10** cities, including İstanbul, Ankara, İzmir |
| G-03 | Full SEO page surface operational | Institution, city, district, and type landing pages generating indexable URLs |
| G-04 | End-to-end lead path works | Parent can submit a lead; claimed institution (or admin) can view it |
| G-05 | Claim path works | Institution can request claim; admin can approve; institution can edit profile |

### 4.2 Post-launch growth goals (first 90 days)

| Goal ID | Goal | Measure |
| --- | --- | --- |
| G-06 | Organic acquisition | Measurable organic sessions; week-over-week growth after indexation |
| G-07 | Indexation | Majority of public MVP URLs submitted via sitemap and eligible for indexing |
| G-08 | Supply engagement | ≥ **50** approved institution claims |
| G-09 | Demand conversion | ≥ **200** qualified lead requests submitted |
| G-10 | Data quality | Claimed profiles show higher completeness than unclaimed baseline |

### 4.3 Non-goals for goal-setting

- Revenue / paid plans (post-MVP)
- App-store installs (no native apps in MVP)
- Review volume or star ratings as a success metric (not in MVP)

---

## 5. Problem statement

### 5.1 Problems faced by parents (and students)

| Problem | Detail |
| --- | --- |
| **Fragmented discovery** | Options are scattered across Google results, Instagram pages, WhatsApp groups, and word of mouth. Comparison is manual and incomplete. |
| **Inconsistent information** | Fees (if shown), ages served, addresses, programs, and contact details differ by channel and go stale quickly. |
| **Weak local intent match** | Generic search returns national brands, ads, and irrelevant results; district-level discovery is hard. |
| **High-friction contact** | Contact often means DMing Instagram, finding a phone number on an outdated site, or visiting in person without prior context. |
| **No structured comparison** | Parents cannot reliably filter by city + district + institution type and then open consistent profile pages. |

### 5.2 Problems faced by institutions

| Problem | Detail |
| --- | --- |
| **Dependence on rented attention** | Instagram and ads create reach that disappears when spend or algorithm changes. |
| **Poor organic representation** | Many institutions lack strong, structured web pages that rank for “\[type\] \[district\]” queries. |
| **Unqualified inbound noise** | Phone and DM inquiries are unstructured; no shared inbox or lead history. |
| **Directory tax without ownership** | Generic directories list them with thin data and little control over accuracy or leads. |
| **No claimable profile** | Institutions cannot easily “own” a canonical public page and keep it updated. |

---

## 6. Value proposition

### 6.1 Why EduAtlas vs Google Search

| Google Search | EduAtlas |
| --- | --- |
| Unstructured mix of ads, maps, blogs, and institution sites | Purpose-built catalog for education discovery in Türkiye |
| Inconsistent page formats; hard to compare | Standardized institution profiles and filters |
| Local intent requires many queries | City, district, type, and keyword search in one product |
| Contact paths vary by site | One lead request pattern across institutions |
| No institution claim workflow owned by EduAtlas | Claim → verify → manage profile → receive leads |

EduAtlas does not replace Google; it **wins the clicks** Google sends to category/local queries by owning high-quality landing and institution pages.

### 6.2 Why EduAtlas vs Instagram

| Instagram | EduAtlas |
| --- | --- |
| Discovery depends on followers, ads, and Reels | Search and SEO pages match explicit intent (“Kadıköy anaokulu”) |
| Profiles are social, not structured comparison data | Structured fields: type, location, contact, programs |
| DMs are private, ephemeral, hard to measure | Leads are captured, routed, and trackable |
| Weak long-term search asset | Indexable pages compound over time |

Instagram remains a marketing channel; EduAtlas is the **intent and conversion layer**.

### 6.3 Why EduAtlas vs generic directories

| Generic directories | EduAtlas |
| --- | --- |
| Thin listings, outdated phones, weak category depth | Education-only taxonomy for launch categories |
| Little SEO depth for city/district/type combinations | Dedicated SEO landing pages and internal linking |
| Institutions rarely “own” the listing | Claim + institution panel |
| Lead products often opaque or paywalled at list-time | Clear MVP lead flow; monetization after product-market fit |

---

## 7. MVP features

Include **only** launch features. Each feature below is required for MVP unless marked optional within a subsection.

### 7.1 Feature map

| Area | MVP capability |
| --- | --- |
| Search & browse | Keyword + city + district + institution type filters |
| Institution page | Public profile with required fields and lead CTA |
| SEO surfaces | Home/marketing landing, institution, city, district, type pages |
| Lead generation | Information request form → storage → institution/admin visibility |
| Claims | Request claim → admin review → approved editor access |
| Institution panel | Edit profile, view leads, update basic status |
| Admin panel | CRUD institutions, moderate claims, oversee leads, publish/unpublish |
| Trust & safety | Basic validation, spam controls, manual claim verification |
| Platform | Auth for institutions and admins; public read for catalog |

### 7.2 User journeys (MVP)

**J1 — Parent discovers and contacts**

1. Lands on city, district, type, or search results page (organic or direct).
2. Filters or searches for institutions.
3. Opens an institution page.
4. Submits an information request (lead).
5. Sees confirmation; institution/admin receives the lead.

**J2 — Institution claims and manages**

1. Finds institution page or marketing CTA “Kurumunu sahiplen”.
2. Submits claim request with verification details.
3. Admin reviews and approves or rejects.
4. On approval, institution user accesses Institution Panel.
5. Updates profile; views and manages incoming leads.

**J3 — Admin operates the catalog**

1. Creates or imports institution records.
2. Publishes pages when minimum content quality is met.
3. Reviews claim queue.
4. Monitors leads for unclaimed institutions and spam.

---

## 8. Search

### 8.1 Purpose

Search is the primary discovery tool for parents and students. It must support **intent narrowing** by geography and institution type, plus free-text keyword matching.

### 8.2 Institution search

| Requirement | Specification |
| --- | --- |
| Results | List of published institutions matching active filters and query |
| Sort (MVP) | Default relevance (keyword match + completeness signals); optional “name A–Z” |
| Empty state | Clear message + suggestions to broaden city/district/type |
| Pagination | Paginated or equivalently bounded result sets suitable for SEO crawl and UX |
| Result card fields | Name, type, city, district, short summary/snippet, claim badge if claimed |

### 8.3 City filter

- User can filter (or browse) by **city** (il).
- City list covers all cities with at least one published institution; seed data must include major metros at launch.
- Selecting a city scopes results to institutions in that city.
- City selection deep-links to or aligns with **city SEO pages** where applicable.

### 8.4 District filter

- User can filter by **district** (ilçe) **after** a city is selected (or when context is already city-scoped).
- District options are those available for the selected city that have published institutions (or full static district list with empty states — product may choose either, but behavior must be consistent).
- District filter aligns with **district SEO pages**.

### 8.5 Institution type filter

Supported MVP types (multi-select optional; single-select minimum):

1. Private school (Özel okul)
2. Course center (Dershane)
3. Study center (Etüt merkezi)
4. Language school (Dil okulu)
5. Kindergarten (Anaokulu)
6. Preschool (Kreş / okul öncesi)

An institution may have **one primary type** in MVP (simplifies SEO URLs and filters). If an institution legitimately spans types, primary type is mandatory; secondary types are **out of scope** unless added in a PRD revision.

### 8.6 Keyword search

| Requirement | Specification |
| --- | --- |
| Scope | Institution name and key profile text fields (e.g., summary, programs/tags if present) |
| Behavior | Case-insensitive; Turkish character tolerant where feasible (ı/i, ş/s, ğ/g, ü/u, ö/o, ç/c) |
| Combination | Keywords work **with** city, district, and type filters |
| UX | Search input on home, search results, and relevant landing pages |

### 8.7 Acceptance criteria — Search

- Parent can find an institution by name keyword.
- Parent can list all published kindergartens in a selected district.
- Filters are reflected in the URL query or path in a shareable way (SEO-compatible where the page is a landing page).
- Unpublished institutions never appear in public search.

---

## 9. Institution page

The institution page is the **canonical public profile** and primary conversion surface.

### 9.1 Required information (must be present to publish)

| Field | Description |
| --- | --- |
| **Name** | Official or commonly used institution name |
| **Primary type** | One of the six MVP types |
| **City** | İl |
| **District** | İlçe |
| **Address** | Street-level address text |
| **Short description** | 1–3 paragraph summary for parents |
| **Contact phone** | At least one phone number **or** explicit “phone on request” policy is insufficient — MVP requires phone **or** email; at least one direct contact method required |
| **Contact email** | Recommended; required if phone absent |
| **Lead CTA** | Visible information-request action |

### 9.2 Required supporting fields (MVP)

| Field | Description |
| --- | --- |
| **Slug / public URL** | Stable, human-readable path |
| **Publish status** | Draft / published / unpublished |
| **Claim status** | Unclaimed / pending / claimed |
| **Programs / offerings summary** | Free text or structured short list (age groups, levels, courses) |
| **Age / level focus** | e.g., preschool ages, Lise, YKS, general English — as applicable to type |
| **Website URL** | Optional but strongly recommended |
| **WhatsApp number** | Optional |
| **Cover / logo image** | At least one image recommended; placeholder allowed for launch seed data |
| **Location notes** | Optional (near metro, etc.) |
| **Updated at** | Last profile update timestamp shown or available to admin |

### 9.3 Page UX requirements

- Clear hierarchy: name, type, location, description, contact, lead form.
- Mobile-usable layout; lead form reachable without hunting.
- Claimed badge when claim is approved.
- “Claim this institution” CTA when unclaimed.
- No dependency on reviews, rankings, or paid badges for MVP.

### 9.4 Acceptance criteria — Institution page

- All required fields render for published institutions.
- Lead form submits successfully from the page.
- Page is indexable when published (see SEO).
- Unpublished pages are not publicly accessible or are `noindex` and unlinked (choose one consistent rule; prefer not publicly accessible).

---

## 10. Lead generation

### 10.1 Purpose

Convert discovery into a **structured information request** that institutions can act on.

### 10.2 Parent / student request flow

1. User opens institution page.
2. User completes lead form.
3. System validates and stores lead.
4. User sees success confirmation.
5. Notification/visibility:
   - **Claimed institution:** lead visible in Institution Panel (email notification recommended for MVP).
   - **Unclaimed institution:** lead visible to Admin; optional later routing when claimed.

### 10.3 Lead form fields (MVP)

| Field | Required | Notes |
| --- | --- | --- |
| Full name | Yes | Parent or student name |
| Phone | Yes | Primary callback channel in Türkiye |
| Email | No | Recommended |
| Role | Yes | Parent / Student / Other |
| Message | Yes | Free text interest / questions |
| Preferred contact time | No | Simple text or select |
| Consent | Yes | Explicit consent to share data with the institution and EduAtlas processing notice |

### 10.4 Lead lifecycle (MVP)

| Status | Meaning |
| --- | --- |
| `new` | Just submitted |
| `read` | Opened by institution or admin |
| `contacted` | Marked as contacted |
| `closed` | Completed or dismissed |
| `spam` | Marked as spam (admin or institution) |

### 10.5 Abuse controls (MVP minimum)

- Required fields + basic format validation (phone/email).
- Rate limiting per IP / fingerprint adequate to stop bulk spam.
- Honeypot or equivalent lightweight bot deterrence.
- Admin ability to mark spam and hide from institution view if needed.

### 10.6 Acceptance criteria — Leads

- Valid form creates a durable lead record linked to the institution.
- Claimed institution users can list and update lead status.
- Admins can list leads across institutions.
- Consent is captured and stored with the lead.

---

## 11. Admin panel

For platform administrators only.

### 11.1 Required capabilities

| Capability | Detail |
| --- | --- |
| **Authentication** | Secure login; admin-only authorization |
| **Institution CRUD** | Create, edit, unpublish/publish, delete/archive |
| **Bulk-friendly create** | Manual create sufficient; CSV import optional but recommended if seed volume requires |
| **Claim queue** | List pending claims; approve / reject with reason |
| **Lead oversight** | View leads; filter by institution, status, date; mark spam |
| **User oversight** | View institution users linked to claims; disable access if abused |
| **Catalog quality** | See incomplete profiles; enforce publish rules |
| **Basic metrics** | Counts: institutions by type/city, claims pending, leads (new/total) |

### 11.2 Admin workflows

- Publish institution only when required fields are complete.
- Approve claim → grant institution panel access to claimant account.
- Reject claim → notify claimant with reason (email or in-product).

### 11.3 Acceptance criteria — Admin

- Admin can create and publish an institution that appears in search and SEO pages.
- Admin can approve a claim and the institution user can edit thereafter.
- Admin can find and moderate a spam lead.

---

## 12. Institution panel

For users with an **approved claim** on an institution.

### 12.1 Required capabilities

| Capability | Detail |
| --- | --- |
| **Authentication** | Secure login for institution users |
| **Profile editing** | Edit allowed profile fields (name change may require admin approval — recommended) |
| **Media** | Upload/replace logo or cover (within size/type limits) |
| **Lead inbox** | List leads for their institution; open detail; update status |
| **Claim status view** | See that the institution is claimed and linked to their account |
| **Contact preferences** | Update phone, email, WhatsApp used on public page |

### 12.2 Not in institution panel (MVP)

- Billing / subscriptions
- Boosted placement purchase
- Multi-branch hierarchies
- Team roles beyond a simple owner user (single owner is enough; additional members optional)

### 12.3 Acceptance criteria — Institution panel

- Approved claimant can update description and contact fields; changes reflect on the public page.
- Approved claimant can see new leads and mark them contacted.
- Unapproved users cannot edit the institution.

---

## 13. SEO

SEO is a **launch requirement**, not a follow-up. EduAtlas must win organic queries such as:

- `\[ilçe\] anaokulu`
- `\[il\] dershane`
- `\[ilçe\] dil okulu`
- `\[kurum adı\]`

### 13.1 SEO principles

1. **One intent → one primary URL** where possible.
2. **Index only published, valuable pages** (no empty thin doors).
3. **Consistent internal linking** between city ↔ district ↔ type ↔ institution.
4. **Structured data** on institution pages.
5. **Fast, mobile-first, crawlable HTML** for all public SEO surfaces.
6. **Turkish-language** primary content and metadata for MVP.

### 13.2 Landing pages

| Page | Purpose | Index |
| --- | --- | --- |
| Home / marketing landing | Explain EduAtlas; entry to search and popular hubs | Yes |
| Global search results | Filtered discovery | Prefer canonical to clean landing URLs when filters match a hub page |
| Static trust pages | About, contact, privacy, terms | Yes |

Home must expose paths into city and type hubs.

### 13.3 Institution pages

| Requirement | Specification |
| --- | --- |
| URL | Stable slug, e.g. `/kurum/{slug}` (final pattern in architecture/SEO implementation notes) |
| Title | `{Name} \| {Type} \| {District}, {City} \| EduAtlas` (pattern adaptable) |
| Meta description | Unique; derived from short description |
| Canonical | Self-canonical when published |
| Content | Unique description; no duplicate boilerplate-only pages |
| Indexing | `index,follow` when published |

### 13.4 City pages

| Requirement | Specification |
| --- | --- |
| Purpose | Hub for institutions in a city (“İstanbul’da eğitim kurumları”) |
| Content | Intro copy + lists/links by type and districts with supply |
| Indexing | Index when the city has ≥ 1 published institution |
| Internal links | To districts, types-in-city, and top/all institutions in city |

### 13.5 District pages

| Requirement | Specification |
| --- | --- |
| Purpose | Capture local intent (“Kadıköy anaokulu” via district+type combos and district hubs) |
| Content | District intro + institution list + links to types |
| Indexing | Index when district has ≥ 1 published institution |
| Thin content rule | Do not index empty districts |

### 13.6 Institution type pages

| Requirement | Specification |
| --- | --- |
| Purpose | National and nested type hubs (“Türkiye’de dershaneler”, “Ankara dil okulları”) |
| MVP minimum | (a) national type pages (b) city + type pages when supply exists |
| District + type | Required when enough supply exists; generate only when ≥ 1 matching institution to avoid thin pages |
| Internal links | To institutions and related geo hubs |

### 13.7 Schema.org

| Page type | Schema (MVP) |
| --- | --- |
| Institution page | `EducationalOrganization` or more specific subtype when applicable (`School`, etc.), with name, address, telephone, url, image |
| Breadcrumbs | `BreadcrumbList` on institution and hub pages |
| Optional | `WebSite` + `SearchAction` on home |

JSON-LD preferred. Validate that required organization fields match visible page content.

### 13.8 Internal linking

Mandatory link graph (conceptual):

```text
Home
 ├─ Type hubs (national)
 ├─ City hubs
 │   ├─ District hubs
 │   ├─ City + type hubs
 │   └─ Institutions
 └─ Institutions
```

Rules:

- Every institution page links to its city, district, and type hubs.
- Every hub lists institutions (paginated) and child hubs.
- Footer/nav includes key discovery entry points without creating spammy link blocks.
- No orphan published institution pages.

### 13.9 Technical SEO checklist (MVP)

| Item | Requirement |
| --- | --- |
| `sitemap.xml` | Includes all published indexable URLs; kept updated |
| `robots.txt` | Allows public SEO surfaces; disallows admin/institution private areas |
| Canonical tags | Present on public pages |
| Open Graph basics | Title, description, image for shareability |
| 404 handling | Clean 404 for unknown slugs |
| HTTPS | Required |
| Performance | Mobile LCP suitable for SEO (no formal score gate beyond “no broken UX”) |
| Hreflang | Not required (single locale MVP) |

### 13.10 Acceptance criteria — SEO

- Published institution has a unique indexable URL with title/meta/schema.
- City and type hub pages exist for launch supply and link to institutions.
- Empty geo/type combinations are not indexed.
- Sitemap lists launch URLs; admin and panel routes are not indexed.

---

## 14. Success metrics

### 14.1 Traffic

| Metric | Definition |
| --- | --- |
| Sessions | Total sessions on public site |
| Organic sessions | Sessions from organic search |
| Engagement | Institution page views per session; search→page conversion rate |
| Top landing pages | Ranked list of SEO hubs and institution pages |

### 14.2 Institutions

| Metric | Definition |
| --- | --- |
| Published institutions | Count by type and city |
| Profile completeness | % meeting required + recommended fields |
| Claimed institutions | Approved claims / published institutions |
| Claim pending time | Median time pending → decision |

### 14.3 Leads

| Metric | Definition |
| --- | --- |
| Lead requests | Total submitted |
| Leads per published institution | Demand density |
| Lead status conversion | new → contacted rate (claimed institutions) |
| Spam rate | spam / total leads |

### 14.4 SEO

| Metric | Definition |
| --- | --- |
| Indexable URL count | Published SEO URLs |
| Indexed pages | Pages reported as indexed (Search Console) |
| Impressions / clicks | Search Console for brand + non-brand |
| Query coverage | Appearances for `{district} {type}` style queries |

---

## 15. Out of scope (MVP)

Explicitly **will not** exist in MVP:

- Payments, subscriptions, featured listings, or paid placement
- Native iOS/Android apps
- Multi-language UI (English or other); MVP is **Turkish-first**
- Student enrollment / application processing / e-registration
- Online payments of tuition
- Reviews, star ratings, or UGC comment systems
- Social feed, messaging chat, or in-app DM thread
- Map-based discovery beyond address text (embedded interactive maps optional later)
- Advanced recommendation ML
- Advertising manager / sponsored campaigns
- Multi-campus franchise hierarchies
- Public institution comparison matrix tool (side-by-side table) — users compare by visiting pages; dedicated compare UI is out of scope
- Parent accounts (browse/lead without mandatory parent login)
- Full CRM for institutions (pipelines, automations) beyond lead statuses above
- WhatsApp Business API automation (WhatsApp number display is enough)
- University / public school coverage outside launch categories
- AI chatbot counselor

---

## 16. Release criteria

Launch on **15 August 2026** (or agreed slip) only when **all** criteria below are true.

### 16.1 Product completeness

- [ ] Search with city, district, type, and keyword meets §8 acceptance criteria
- [ ] Institution pages meet §9 required fields and acceptance criteria
- [ ] Lead generation meets §10 acceptance criteria
- [ ] Admin panel meets §11 acceptance criteria
- [ ] Institution panel meets §12 acceptance criteria
- [ ] SEO surfaces in §13 exist for launch supply and pass technical checklist

### 16.2 Data & coverage

- [ ] ≥ 500 published institutions across MVP types **or** revised target formally approved in PROJECT-DASHBOARD
- [ ] Priority cities covered (İstanbul, Ankara, İzmir + agreed others)
- [ ] No published institution missing required fields

### 16.3 Quality & trust

- [ ] Privacy policy and terms published
- [ ] Consent captured on lead form
- [ ] Claim approve/reject path tested end-to-end
- [ ] Spam controls enabled
- [ ] Unpublished and private routes not indexed

### 16.4 Reliability

- [ ] Production environment deployed with HTTPS
- [ ] Staging verified for J1–J3 journeys
- [ ] Backup/export or recovery approach documented for primary data store
- [ ] Basic error monitoring in place for public form submission failures
- [ ] Sitemap submitted to Search Console

### 16.5 Go / no-go

| Result | Condition |
| --- | --- |
| **Go** | All release criteria checked; residual risks accepted in writing |
| **No-go** | Any of §16.1 journeys broken, or SEO indexables missing for core hubs, or lead path failing in production |

---

## 17. Assumptions and dependencies

| Assumption | Impact if false |
| --- | --- |
| Seed institution data can be collected legally and at launch volume | Coverage goals slip; SEO thin |
| Manual claim review is viable at early volume | Admin bottleneck; may need extra operators |
| Turkish-only UI is acceptable for MVP audience | May block some expatriate users (accepted) |
| Firebase (or agreed stack) can support search + SEO rendering requirements | Architecture must accommodate SEO (SSR/SSG or equivalent) |
| Institutions will respond to leads if notified | Lead value proposition weakens |

---

## 18. Open questions

Resolve during Sprint-001 remainder or Sprint-002 kickoff; do not block PRD adoption.

1. Exact URL taxonomy (`/istanbul/kadikoy/anaokulu` vs query hubs).
2. Whether district+type pages are generated for all non-empty combos at launch.
3. Name-change policy after claim (self-serve vs admin approval).
4. Email notification provider for leads and claim decisions.
5. Minimum image requirements before publish.
6. Final numeric targets if 500 institutions proves unrealistic before 15 August 2026.

---

## 19. Glossary

| Term | Meaning |
| --- | --- |
| **Institution** | An educational organization in a launch category |
| **Claim** | Request by a representative to own and edit an institution profile |
| **Lead** | Structured information request from a parent/student |
| **Hub page** | SEO landing page for city, district, and/or type |
| **Published** | Publicly visible and eligible for indexation |

---

## 20. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| Engineering | | | ☐ |
| Launch owner | | | ☐ |

**Once signed, this PRD v2 is the binding MVP contract.** Scope changes require a versioned PRD update and dashboard note.
