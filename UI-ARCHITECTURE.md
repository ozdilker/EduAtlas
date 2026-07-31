# EduAtlas — UI Architecture

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | UI-ARCHITECTURE.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-010 |
| **Status** | Binding UI / screen architecture |
| **Locale (MVP)** | Turkish (`tr-TR`) |
| **Last updated** | 13 July 2026 |

---

## Document control

This document defines the **complete user interface architecture** for EduAtlas — every primary screen, flow, navigation pattern, and global component across Public Website, Institution Portal, and Admin Panel.

| Related document | Role |
| --- | --- |
| `PRD.md` | Product journeys & MVP scope |
| `SEO-ARCHITECTURE.md` | Public URL surfaces |
| `INSTITUTION-PROFILE-SPECIFICATION.md` | `/kurum/{slug}` detail |
| `SYSTEM-ARCHITECTURE.md` | Apps & rendering |
| `BUSINESS-MODEL.md` | Premium / claim incentives |
| `FIREBASE-ARCHITECTURE.md` | Roles & data visibility |

**Non-goals:** Visual brand tokens as a full design system dump, React implementation, or pixel mockups.

---

## 1. Purpose

Describe every screen of EduAtlas so product, design, and engineering share one map of:

- Who sees what  
- How primary jobs are completed  
- How navigation, empty/error states, a11y, and analytics apply globally  

UI must serve **discovery → trust → contact/lead → claim/ops**, at national scale.

---

## 2. User types & UI surfaces

| User type | Auth (MVP) | Primary surfaces | Goals in UI |
| --- | --- | --- | --- |
| **Anonymous Visitor** | None | Public Website | Find institutions, submit leads |
| **Parent** | None MVP; Auth later | Public (+ Favorites when enabled) | Decide & contact; save for later |
| **Institution Owner** | Required | Institution Portal (+ public profile) | Claim, edit, respond to leads |
| **Moderator** | Required | Admin Panel (limited) | Review claims, moderate content |
| **Administrator** | Required | Admin Panel (full) | Catalog, SEO, users, settings |
| **Super Admin** | Required | Admin + system settings | Roles, dangerous ops |

**Note:** In MVP, “Parent” and “Anonymous Visitor” share the same public UI; Favorites may be local/deferred until Parent Auth ships (`INSTITUTION-PROFILE-SPECIFICATION` open decision).

---

## 3. Information architecture (apps)

```text
Public Website          Institution Portal         Admin Panel
──────────────          ──────────────────         ───────────
Marketing + SEO hubs    Owner home                 Ops home
Search & results        Profile editor             Institutions
Institution profile     Gallery / programs         Claims queue
Lead & claim entry      Leads inbox                Leads oversight
Blog / static           Analytics (basic)          Content / SEO
                        Subscription (future)      Users / Reports / Settings
```

Shell chrome differs: public marketing header vs portal app shell vs admin console shell.

---

## 4. Primary flows

### 4.1 Institution discovery

```text
Home / Hub / Search
  → Filters (city, district, type, keyword)
  → Results list
  → Institution card click
  → Institution profile
```

**Entry points:** home search, national type, city, district, district×type, organic landing.

### 4.2 Institution comparison (future)

```text
Select 2–N institutions (from results or favorites)
  → Comparison view (attributes table)
  → Jump to profile / lead CTA per column
```

MVP: parents compare by opening multiple profiles; no dedicated compare screen.

### 4.3 Institution detail

Full profile per `INSTITUTION-PROFILE-SPECIFICATION.md` (hero → facts → contact → lead → content → related).

### 4.4 Lead generation

```text
Profile CTA (Bilgi Al / sticky bar)
  → Lead form (inline or dialog)
  → Validation
  → Success confirmation (noindex)
  → Optional: call / WhatsApp alternate paths
```

### 4.5 Favorites

```text
Profile or card → Favorite toggle
  → Favorites list page (when enabled)
  → Return to profiles
```

MVP: implement UI hooks; persistence may be local until Parent Auth.

### 4.6 Institution claim

```text
Unclaimed profile → “Kurumunu sahiplen”
  → Auth (register/login) if needed
  → Claim form (role, proof upload)
  → Pending state
  → (Admin) approve/reject
  → Owner dashboard access
```

### 4.7 Institution dashboard

```text
Login → Portal home
  → Edit profile / media / programs
  → Leads inbox → status updates
  → Basic analytics
```

### 4.8 Admin moderation

```text
Admin login → Queues
  → Claims review / institution publish QA
  → Lead spam tools
  → SEO / content overrides
  → Reports & settings
```

---

## 5. Public website — page inventory

URLs align with `SEO-ARCHITECTURE.md`.

| Page | Route (logical) | Purpose | MVP |
| --- | --- | --- | --- |
| **Home** | `/` | Value prop, search entry, popular hubs | Yes |
| **Search** | `/ara` | Global results + filters | Yes |
| **City** | `/{city}` | City hub | Yes |
| **District** | `/{city}/{district}` | District hub | Yes |
| **Category / Type** | `/{type}`, `/{city}/{type}`, `/{city}/{district}/{type}` | Type & geo×type hubs | Yes |
| **Institution** | `/kurum/{slug}` | Profile | Yes |
| **Program** | `/kurum/{slug}/program/{program}` · `/program/{slug}` | Program detail / hubs | Future |
| **Blog index** | `/blog` | Guides | Partial/Future |
| **Blog post** | `/blog/{slug}` | Article | Partial/Future |
| **About** | `/hakkimizda` | Trust | Yes |
| **Contact** | `/iletisim` | Platform ContactRequest | Yes |
| **Privacy / Terms** | `/gizlilik`, `/kullanim-kosullari` | Legal | Yes |
| **Claim start** | `/sahiplen` or profile-deep | Claim funnel entry | Yes |
| **Favorites** | `/favoriler` | Saved list | Optional MVP+ |
| **Lead thank-you** | `/tesekkurler` or inline | Confirmation | Yes (`noindex`) |
| **Auth** | `/giris`, `/kayit` | Owner (and future parent) auth | Yes (owner) |

### 5.1 Home

**Regions:** header, hero with brand + search, shortcuts to types/priority cities, how-it-works (light), footer.  
**Hero budget:** brand, one headline, one supporting line, search/CTA—avoid hub clutter (product marketing discipline).  
**Not in first viewport:** dense stats walls, card grids of unrelated promos.

### 5.2 Search

See §6.

### 5.3 City / District / Category hubs

**Common layout:** breadcrumbs → H1 → intro → filter chips / child links → institution result grid → pagination → related hubs.  
**Empty supply:** do not market empty indexables (SEO gates); UI should rarely hit empty published hubs.

### 5.4 Institution

See §7.

### 5.5 Program (future)

Program header, parent institution link, description, lead CTA scoped to program interest.

### 5.6 Blog

List + article template with internal links to hubs; share controls.

### 5.7 About / Contact

About: mission, trust.  
Contact: form (ContactRequest)—distinct from institution lead form.

---

## 6. Search experience

### 6.1 Global search

| Element | Spec |
| --- | --- |
| Placement | Header search (all public pages); home hero search |
| Input | Keyword; Turkish-friendly placeholder |
| Submit | Navigates to `/ara` with query params **or** updates results |
| Suggestions (future) | Typeahead institutions / districts |

### 6.2 Filters

| Filter | MVP | UI pattern |
| --- | --- | --- |
| City | Yes | Select / combobox |
| District | Yes | Dependent on city |
| Institution type | Yes | Select or chip group |
| Keyword | Yes | Text field |
| Category tags | Partial | Future chips |
| Open now / boarding etc. | Future | Facets |

Filters sync to URL for shareability; when combo matches a hub, prefer canonical hub UX (`SEO-ARCHITECTURE`).

### 6.3 Sorting

| Sort | MVP |
| --- | --- |
| Relevance (default) | Yes |
| Name A–Z | Yes |
| Distance | Future (geo) |
| Rating | Future (reviews) |

### 6.4 Results presentation

- Institution **cards**: name, type, district/city, snippet, claim badge, optional cover thumb, primary CTA.  
- List density: comfortable on mobile; multi-column on desktop.  
- Pagination or “load more”—consistent sitewide.

### 6.5 Map view (future)

Toggle list/map; pins → card preview → profile. Not MVP.

### 6.6 Saved searches (future)

Requires Parent Auth; save filter set; notify later (optional).

---

## 7. Institution profile — screen hierarchy

Canonical detail screen. Hierarchy (composition tree):

```text
InstitutionProfilePage
├── PublicHeader
├── Breadcrumbs
├── Hero
│   ├── Media (logo/cover)
│   ├── Identity (H1, type, location, badges)
│   ├── Actions (Lead, Call, WhatsApp, Claim, Favorite, Share)
├── GalleryModule (optional)
├── QuickFactsModule
├── ContactModule
├── LeadModule (form / CTA)
├── MapModule
├── DescriptionModule
│   ├── AISummary (optional, labeled)
│   ├── Facilities / Advantages
│   ├── Admission / Scholarships (optional)
├── ProgramsModule
├── PricingModule (optional)
├── BranchesModule (optional)
├── AchievementsModule (optional)
├── TeachersModule (future)
├── ReviewsModule (future)
├── FAQModule
├── NearbyModule
├── SimilarModule
├── RelatedBlogModule (optional)
├── MobileStickyCtaBar
└── PublicFooter
```

Full field/CTA rules: `INSTITUTION-PROFILE-SPECIFICATION.md`.  
This UI architecture owns **where it sits in the product screen map** and navigation in/out.

**Inbound:** search, hubs, blog, ads, share links.  
**Outbound:** hubs via breadcrumbs, related cards, external website, claim funnel, auth.

---

## 8. Institution Owner dashboard (portal)

App shell: side nav (desktop) / bottom or drawer nav (mobile), top bar with institution switcher (future multi-owned).

### 8.1 Screen inventory

| Screen | Purpose | MVP |
| --- | --- | --- |
| **Login / Register** | Auth | Yes |
| **Portal home** | Snapshot: new leads, profile completeness, claim status | Yes |
| **Profile management** | Edit allowlisted fields, hours, contact | Yes |
| **Gallery** | Upload/reorder/delete images; logo/cover | Yes |
| **Programs** | Summary and/or structured programs | Partial |
| **Leads inbox** | List, detail, status changes | Yes |
| **Lead detail** | Full message, contact, status timeline | Yes |
| **Analytics** | Views, lead counts (basic) | Basic |
| **Claim status** | Pending/rejected reasons | Yes |
| **Subscription** | Premium plans, invoices | Future |
| **Settings** | Notification email prefs | Optional |

### 8.2 Profile management UX

- Inline validation; save explicit.  
- Sensitive fields (name, geo) may show “admin approval required” state.  
- Completeness meter tied to publish quality expectations.

### 8.3 Leads UX

- Filters: status, date.  
- Empty state: education on sharing profile URL.  
- Spam mark available.

### 8.4 Permissions

Only approved owners; revoked owners see access-denied state.

---

## 9. Admin Panel

Console shell: persistent nav, dense tables, queue badges.

### 9.1 Screen inventory

| Area | Screens | MVP |
| --- | --- | --- |
| **Home** | Ops KPIs: pending claims, new leads, publish counts | Yes |
| **Institution moderation** | List, create/edit, publish/unpublish, merge assist | Yes |
| **Institution detail (admin)** | Full record + verification + sources | Yes |
| **Claims queue** | Pending claims; approve/reject with reason | Yes |
| **Lead management** | Cross-institution leads; spam tools | Yes |
| **Users** | Owners/admins list; suspend | Yes |
| **Content** | Blog/announcements (when enabled) | Partial |
| **SEO** | seoPages list, index flags, intro overrides | Yes |
| **Reports** | Exports / basic charts | Basic |
| **System settings** | Flags, thresholds | Yes |

### 9.2 Moderator vs Administrator

| Capability | Moderator | Administrator |
| --- | --- | --- |
| Claims approve/reject | Yes | Yes |
| Edit institutions | Limited / Yes | Yes |
| Publish | Policy-dependent | Yes |
| Users / roles | No | Yes |
| System settings | No | Yes (Super for destructive) |
| SEO overrides | Limited | Yes |

UI must hide unauthorized nav items (not only API deny).

### 9.3 Patterns

- Bulk actions optional later.  
- Every reject requires reason.  
- Audit-friendly confirmations on unpublish/delete/merge.

---

## 10. Global components

| Component | Responsibility |
| --- | --- |
| **Header** | Logo/brand, primary nav, search entry, auth entry (Giriş), portal links if signed in |
| **Footer** | Trust links, type/city entry points (capped), legal, contact |
| **Search bar** | Shared field + submit; filter-aware on `/ara` |
| **Breadcrumbs** | Hierarchy trail; SEO + wayfinding |
| **Institution card** | Consistent result/related appearance |
| **Filters panel** | Desktop sidebar / mobile bottom sheet |
| **Dialogs / drawers** | Lead form modal (optional), confirmations, image lightbox |
| **Notifications (toast)** | Save success, copy address, errors |
| **Badges** | Claimed, verified, premium/featured (labeled) |
| **CTA buttons** | Primary (lead), secondary (call), tertiary |
| **Form controls** | Inputs matching validation package messages |
| **Pagination** | Hubs & search |
| **Empty state block** | Illustration optional; message + action |
| **Error state block** | 404/403/500/offline templates |
| **Skip link** | A11y skip to content |
| **Sticky mobile CTA** | Profile only (call + lead) |

Design system lives in `packages/ui` (system architecture); this doc defines **which** components are global and their roles.

---

## 11. Navigation

### 11.1 Public — primary navigation

| Item | Destination |
| --- | --- |
| Home (logo) | `/` |
| Search / Kurumlar | `/ara` or type hub |
| Types (dropdown or panel) | National type hubs |
| Cities (optional mega) | Priority cities |
| Blog | `/blog` when live |
| Kurumunu sahiplen | Claim entry |
| Giriş | Auth (owners) |

Keep primary nav shallow—SEO hubs carry depth.

### 11.2 Public — secondary navigation

- Hub child links (districts, types).  
- Profile section jump links (optional anchor nav on long profiles).

### 11.3 Footer navigation

- About, Contact, Privacy, Terms  
- Selected type links  
- Selected city links  
- Avoid hundreds of links (SEO spam risk)

### 11.4 Mobile navigation

- Compact header: logo, search icon/field, menu  
- Menu drawer: primary links + claim + login  
- Profile: sticky CTA bar separate from nav  
- Filters: bottom sheet, not tiny sidebar

### 11.5 Institution portal navigation

| Item | Screen |
| --- | --- |
| Özet | Home |
| Profil | Profile management |
| Galeri | Gallery |
| Programlar | Programs |
| Talepler | Leads |
| Analitik | Analytics |
| Abonelik | Future |
| Siteye git | Public profile link |

### 11.6 Admin navigation

| Item | Screen |
| --- | --- |
| Panel | Home |
| Kurumlar | Institutions |
| Sahiplenme | Claims |
| Talepler | Leads |
| Kullanıcılar | Users |
| İçerik | Content |
| SEO | SEO |
| Raporlar | Reports |
| Ayarlar | Settings |

---

## 12. Responsive design

| Breakpoint class | Layout rules |
| --- | --- |
| **Mobile** | Single column; drawer nav; filter sheets; sticky profile CTAs; cards stacked |
| **Tablet** | 2-col result grids; filters collapsible; portal may use compact sidebar |
| **Desktop** | Multi-col grids; filter sidebar on search; portal/admin persistent side nav; wider profile reading measure |

**Shared rules**

- Touch targets ≥ 44px on mobile.  
- Tables in admin: horizontal scroll or responsive card rows.  
- No horizontal page scroll from accidental overflow.  
- Map/gallery must not block primary content on small screens.

---

## 13. Empty states

| Context | Message intent | Primary action |
| --- | --- | --- |
| **No search results** | Broaden filters / try another district | Clear filters; link to city hub |
| **No favorites** | Explain saving | Browse search |
| **No leads (owner)** | Encourage profile completeness + sharing | Edit profile; view public page |
| **Empty claims queue** | All caught up | Go to institutions |
| **No programs yet** | Add first program | Add program |
| **Hub with no UI hit** | Should be rare | Navigate up to parent hub |

Tone: helpful Turkish copy; no blame; one clear next step.

---

## 14. Error states

| State | UI | Notes |
| --- | --- | --- |
| **404** | Dedicated page; search entry; popular hubs | Soft for unknown slugs |
| **403** | Access denied; login or home | Portal/admin unauthorized |
| **500** | Generic apology; retry; home | No stack traces |
| **Offline** | Banner or full page; retry | Client detection |
| **Form submit fail** | Inline + toast; preserve input | Leads critical |
| **Session expired** | Re-auth modal/page | Portals |

---

## 15. Accessibility

Target **WCAG 2.2 Level AA** across public + portals.

| Area | Requirements |
| --- | --- |
| **Keyboard** | All interactive elements reachable; dialogs Esc/trap |
| **Focus** | Visible focus rings; logical order |
| **Screen readers** | Landmarks, labeled forms, live regions for toasts/errors |
| **Contrast** | Text/UI AA; don’t rely on color alone for badges |
| **Alt text** | Meaningful images |
| **Motion** | Respect `prefers-reduced-motion` |
| **Language** | `lang="tr"` |

Admin density is not an excuse for inaccessible tables—provide labels and keyboard sortable headers where interactive.

---

## 16. Analytics (UI events)

Track navigation and key UX transitions (complement profile-detail events).

| Event | When |
| --- | --- |
| `nav_click` | Primary/footer/mobile nav item |
| `search_submit` | Global or hero search |
| `filter_change` | Filter applied/cleared |
| `sort_change` | Sort changed |
| `result_click` | Institution card from search/hub |
| `hub_child_click` | District/type child link |
| `breadcrumb_click` | Breadcrumb segment |
| `auth_entry_click` | Giriş / kayıt |
| `claim_entry_click` | Claim CTA from nav/profile |
| `portal_nav_click` | Owner sidebar |
| `admin_nav_click` | Admin sidebar |
| `empty_state_cta_click` | CTA on empty states |
| `error_page_view` | 404/403/500 views |
| `favorite_toggle` | When enabled |
| `lead_*` / `cta_*` | Per Profile Spec dictionary |

Include page type, route group (`public|panel|admin`), and institution/hub ids when relevant. No message-body PII in event props.

---

## 17. Cross-surface consistency

| Pattern | Public | Portal | Admin |
| --- | --- | --- | --- |
| Institution identity | Card + profile hero | Edit forms | Table + admin detail |
| Lead | Public form | Inbox | Oversight table |
| Claim | Marketing CTA | Status page | Queue decisions |
| Feedback | Toasts | Toasts | Toasts + inline |

Shared `ui` package components with surface themes (marketing vs dense console).

---

## 18. MVP screen checklist

### Public

- [ ] Home, Search, City, District, Type hubs, Institution profile  
- [ ] About, Contact, Privacy, Terms  
- [ ] Auth for owners, Claim funnel, Lead success  
- [ ] 404  

### Owner portal

- [ ] Home, Profile, Gallery, Leads list/detail, basic Analytics, Claim status  

### Admin

- [ ] Home, Institutions CRUD/publish, Claims queue, Leads, Users (basic), SEO list, Settings  

### Deferred UI

- Comparison, Map search, Saved searches, Program pages, Reviews, Subscription, Blog (if not in launch), Parent Auth favorites cloud sync  

---

## 19. Open UI decisions

1. Lead form: inline on profile vs dialog vs dedicated route.  
2. Single Next app route groups vs separate portal hosts (system architecture open).  
3. Favorites persistence before Parent Auth.  
4. Admin table density vs card-first mobile admin.  

---

## 20. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| Design | | | ☐ |
| Engineering | | | ☐ |

**Summary:** EduAtlas UI is three shells—**Public** (SEO discovery + profile + leads), **Owner Portal** (profile/media/leads), **Admin** (moderation/SEO/ops)—with shared global components, clear primary flows, responsive and accessible patterns, and analytics on navigation and conversion, while deferring comparison, map search, and subscription screens until post-MVP.
