# EduAtlas — Project Dashboard

> Single source of truth for product direction, current status, and next steps.  
> Update this document at the start and end of every sprint.

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | PROJECT-DASHBOARD.md |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-001 |
| **Release target** | 15 August 2026 |
| **Last updated** | 13 July 2026 |

---

# Vision

EduAtlas is a discovery and lead platform for educational institutions. It helps students and families find schools, programs, and opportunities through searchable, SEO-optimized institution pages, while giving institutions a clear path to claim their profile, update information, and receive qualified inquiries. The product connects discovery demand with institutional supply through structured data, public landing pages, and a claims-and-leads workflow.

---

# Mission

Finding the right educational institution is fragmented: information is incomplete, outdated, or scattered across websites and directories that do not convert discovery into contact. Institutions struggle to appear in organic search with accurate, comparable profiles and have no simple way to capture inbound interest.

EduAtlas solves this by:

1. Publishing structured, crawlable institution pages that rank and answer real search intent.
2. Enabling institutions to claim and maintain their profiles.
3. Routing student and family interest into measurable lead requests.

---

# Release Target

| Item | Value |
| --- | --- |
| **MVP launch date** | **15 August 2026** |
| **Milestone path** | Sprint-001 Foundation → Sprint-002 Build → Sprint-003 Harden & Launch |
| **Definition of launch** | Public site live with MVP scope below; institutions discoverable; claims and lead requests operational |

---

# Current Milestone

| Field | Value |
| --- | --- |
| **Sprint** | Sprint-001 |
| **Name** | Foundation |
| **Focus** | Define what we build before we build it |
| **Status** | In progress |
| **Outcome** | Locked product definition, PRD, domain model, Firebase architecture, SEO strategy, and release plan |

---

# Current Sprint Goals

Sprint-001 delivers documentation and decisions only — no product implementation.

- **Product Definition** — Clear statement of who EduAtlas serves, what it does, and what success looks like at launch.
- **PRD v2** — Requirements for MVP: user journeys, features, acceptance criteria, and out-of-scope boundaries.
- **Domain Model** — Core entities and relationships (institutions, pages, claims, leads, users/roles).
- **Firebase Architecture** — Auth, data store, hosting/functions boundaries, security rules approach, and environment strategy.
- **SEO Strategy** — URL structure, page types, indexing plan, metadata, and content standards for organic growth.
- **Release Planning** — Sprint sequence, launch checklist, and dependencies to hit 15 August 2026.

---

# MVP Scope

Only what must exist before launch. Nothing speculative.

### Public discovery

- Institution directory (browse and search)
- Individual institution landing pages (crawlable, shareable URLs)
- Core institution profile fields sufficient for comparison and contact intent
- Basic geographic / category filtering as required by the PRD

### SEO & content surface

- Indexable public pages with consistent metadata
- Sitemap and robots configuration
- Canonical URLs for institution pages

### Institution claims

- Claim request flow for institution representatives
- Claim review / approval path (manual is acceptable for MVP)
- Claimed institution ability to update profile fields defined in the PRD

### Leads

- Public “request information” / lead form on institution pages
- Lead capture and delivery to the claimed institution (or internal queue if unclaimed)
- Minimal lead status tracking for ops and institutions

### Platform foundations

- Authentication for claimers and internal operators
- Firebase-backed data model aligned to the domain model
- Basic admin / ops capability to manage institutions, claims, and leads
- Production deploy on the chosen hosting path with environment separation

### Explicitly out of MVP

- Payments, subscriptions, or paid placement
- Advanced analytics dashboards beyond launch metrics
- Mobile apps
- Multi-language localization (unless locked in PRD v2)
- Social features, reviews/ratings systems beyond what PRD v2 requires
- Marketplace transactions or enrollment processing

---

# Success Metrics

Track from launch readiness through the first 90 days. Targets to be finalized in Release Planning; categories below are mandatory.

| Metric | Why it matters |
| --- | --- |
| **Institution count** | Coverage and directory usefulness |
| **Landing pages live** | Public surface area for discovery and SEO |
| **Indexed pages** | Search engines can find and rank the catalog |
| **Organic traffic** | Primary acquisition channel for students/families |
| **Institution claims** | Supply-side engagement and data quality |
| **Lead requests** | Core conversion from discovery to inquiry |

Supporting checks (not vanity): claim approval latency, lead delivery success rate, and page indexation rate for new institutions.

---

# Risks

| Risk | Impact | Mitigation (Sprint-001+) |
| --- | --- | --- |
| **Scope creep past 15 Aug** | Missed launch | Hard MVP boundary; PRD v2 is the contract |
| **Thin or inaccurate institution data** | Poor SEO and low trust | Seed strategy + claim workflow prioritized |
| **SEO underperforms** | Weak organic acquisition | SEO strategy locked in Sprint-001; page quality standards enforced |
| **Claims fraud / unauthorized edits** | Trust and legal exposure | Verification rules; manual review for MVP |
| **Lead quality / spam** | Institution churn | Form validation, rate limits, basic abuse controls |
| **Firebase model lock-in mistakes** | Costly rework mid-sprint | Domain model + architecture review before build |
| **Single-threaded delivery** | Schedule slip | Release plan with clear sprint ownership and cut lines |

---

# Decisions

Decisions made or to be confirmed in Sprint-001. Update status as they lock.

| ID | Decision | Status | Notes |
| --- | --- | --- | --- |
| D-001 | Firebase as primary backend (Auth, Firestore/RTDB per architecture doc, Hosting/Functions as needed) | Proposed | Confirm in Firebase Architecture |
| D-002 | SEO-first public pages are a launch requirement, not a post-MVP add-on | Accepted | Drives URL and content standards |
| D-003 | Manual claim review is acceptable for MVP | Proposed | Automate later if volume requires |
| D-004 | Lead requests are the primary monetizable conversion signal; payments are out of MVP | Accepted | Aligns with MVP scope |
| D-005 | PRD v2 is the binding scope document for build sprints | Accepted | Dashboard defers detail to PRD |
| D-006 | Single product surface at launch (web); no native apps | Accepted | — |

---

# Next Sprint

## Sprint-002 — Build (high level)

Sprint-002 turns Foundation artifacts into a working vertical slice of the MVP.

Expected themes:

- Implement domain model on Firebase
- Ship public institution pages and directory foundations
- Implement claim request + review path
- Implement lead capture and delivery
- Apply SEO baseline (routes, metadata, sitemap)
- Establish deploy pipeline and staging environment

Entry criteria: Sprint-001 goals complete (PRD v2, domain model, Firebase architecture, SEO strategy, release plan approved).  
Exit criteria: Demoable core flows on staging against PRD acceptance criteria; blockers for Sprint-003 (harden & launch) identified.

---

## How to use this dashboard

1. **What are we building?** → Vision, Mission, MVP Scope  
2. **Where are we?** → Current Milestone, Current Sprint Goals, Decisions  
3. **What comes next?** → Next Sprint, Release Target  

Owners: update metrics targets, decision statuses, and sprint status at every sprint boundary.
`)