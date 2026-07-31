# EduAtlas — AI Workforce Architecture

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | AI-WORKFORCE.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-003 — Activation |
| **Task** | Task-011 |
| **Status** | Permanent long-term AI roadmap (architecture only) |
| **Market** | Türkiye |
| **Last updated** | 14 July 2026 |

---

## Document control

This document defines the **long-term AI workforce architecture** for EduAtlas — the permanent roadmap for AI agents that assist catalog growth, trust, commercial activation, content quality, and operations.

It is the AI counterpart to:

| Document | Relationship |
| --- | --- |
| `SYSTEM-ARCHITECTURE.md` | Layered ports; AI plugs in as application services |
| `SECURITY-ARCHITECTURE.md` | Least privilege, PII, audit, App Check |
| `DOMAIN-MODEL.md` | Institutions, leads, claims, ownership |
| `DATA-ACQUISITION.md` | Ingest, provenance, verification, freshness |
| `SEO-ARCHITECTURE.md` | Index gates, thin-content avoidance, NAP integrity |
| `BUSINESS-MODEL.md` | Claim → activate → monetize funnel |
| `PRD.md` | Product scope; MVP excludes live AI counselor |
| `FIREBASE-ARCHITECTURE.md` | Trusted server paths for writes |

**Non-goals of this document**

- No implementation, model selection contracts, or vendor lock-in.
- No silent auto-publish of public institution fields.
- No replacement of Admin claim approval or KVKK consent requirements.
- No offensive tooling, scraping runbooks that violate source terms, or exploit guidance.

**Binding principle (from System Architecture §14)**  
AI modules plug in as **application services behind ports** — never as silent writers to published NAP (name / address / phone) fields.

---

## 1. Purpose

EduAtlas will scale toward **hundreds of thousands of institutions** and **millions of visitors**. Human ops alone cannot sustain catalog completeness, claim verification, lead quality, SEO content depth, and freshness.

The AI workforce exists to:

1. **Propose** catalog and content changes at scale.  
2. **Prioritize** human attention (claims, duplicates, spam, thin pages).  
3. **Assist** owners and admissions with structured workflows — without inventing CRM.  
4. **Measure** quality and commercial health for product and ops decisions.  
5. Remain **Atlas CLI / MCP-extensible** so future Atlas OS products can reuse agent patterns.

AI is a **workforce layer**, not a product surface for parents in MVP (no public AI chatbot counselor per `PRD.md`).

---

## 2. Architecture principles

| Principle | Meaning |
| --- | --- |
| **Propose → review → commit** | Agents produce drafts, scores, and recommendations; privileged writes require human or explicit policy gates |
| **Ports over prompts** | Agents call application use cases / repositories; they do not import Firestore into UI or bypass AuthZ |
| **Least privilege** | Each agent has a narrow permission set; no agent holds `super_admin` by default |
| **PII minimization** | Lead/claim PII is redacted in prompts/logs unless the task strictly requires it |
| **Provenance** | Every AI-touched field carries source, model/run id, confidence, and `aiGenerated` / `aiAssisted` flags where applicable |
| **SEO safety** | Thin or boilerplate AI text must not become indexable without quality gates (`SEO-ARCHITECTURE.md`) |
| **NAP integrity** | Name, address, phone changes from AI never auto-publish |
| **Human accountability** | High-impact actions (claim approve, merge, unpublish, role grant) remain human-owned |
| **Observable** | Runs emit structured audit events (agent id, trigger, inputs hash, decision, latency) |
| **Composable MCP** | Future tool access is via MCP servers / Atlas integrations, not hardcoded scrapers in product UI |

### 2.1 Placement in the system

```text
Triggers (cron, events, admin UI, owner UI)
        ↓
  AI Orchestrator (future) — routing, budgets, retries
        ↓
  Agent (mission-scoped) — reasoning + tool calls via ports
        ↓
  Application services / repositories
        ↓
  Firebase / Search / Email / Analytics (infrastructure)
        ↓
  Human review queues (Admin / Owner) when required
```

Agents **never** write directly from the public Next.js UI. They run in trusted server/worker contexts (Cloud Functions, Workflows, or future agent runtime).

### 2.2 Shared agent contract

Every agent specification below uses the same fields:

| Field | Definition |
| --- | --- |
| **Mission** | Why the agent exists |
| **Inputs** | Data and signals it may consume |
| **Outputs** | Artifacts it produces |
| **Triggers** | What starts a run |
| **Permissions** | Allowed read/write/tool scope |
| **Human approval** | When a human must decide |
| **KPIs** | How success is measured |
| **Future MCP integrations** | External tools/servers expected later |

### 2.3 Permission tiers (reference)

| Tier | Allowed | Typical agents |
| --- | --- | --- |
| **T0 — Read / draft** | Read public catalog; draft text; score; queue items | Content (draft), Analytics |
| **T1 — Internal write** | Write drafts, scores, suggestions, flags — not published NAP | Catalog, Quality, Duplicate, Update |
| **T2 — Moderated write** | Apply non-NAP or non-index changes after soft gates | Moderation (spam lead status), Sales outreach queues |
| **T3 — Human-gated** | Propose only; commit requires Admin/Owner | Verification, claim-linked actions, merges |
| **T4 — Forbidden** | Role grants, billing mutations, secret access, public Rules bypass | None |

---

## 3. Agent catalog overview

| Agent | Primary domain | Impact |
| --- | --- | --- |
| **Catalog Agent** | Institution discovery & enrichment candidates | Supply coverage |
| **Sales Agent** | Claim / premium activation outreach | Revenue & claim rate |
| **Admissions Agent** | Owner-side lead response assist | Lead conversion |
| **Quality Agent** | Completeness, publish readiness, SEO quality | Trust & index health |
| **Content Agent** | Descriptions, hub intros, Turkish copy drafts | SEO depth |
| **Verification Agent** | Claim evidence & ownership trust | Safety |
| **Duplicate Agent** | Merge / dedupe candidates | Catalog integrity |
| **Analytics Agent** | Insights, anomalies, forecasts | Decisions |
| **Update Agent** | Freshness, change detection | Data currency |
| **Moderation Agent** | Spam, abuse, SEO spam, unsafe content | Trust & safety |

---

## 4. Catalog Agent

### Mission

Discover, normalize, and propose **new or incomplete Institution** records so EduAtlas approaches national coverage without flooding the index with junk.

### Inputs

- Seed lists and geo/type priority queues (`DATA-ACQUISITION.md`)  
- Public web / Maps candidate signals (policy-compliant sources only)  
- Existing `institutions` snapshots (ids, slugs, NAP hashes, claimStatus)  
- City / district / type taxonomy  
- Quality scores and duplicate hints from sibling agents  

### Outputs

- Candidate institution drafts (structured fields + provenance)  
- Enrichment patches for incomplete drafts (programs summary, website, hours)  
- Priority scores (city × type × demand)  
- Ingest jobs for Admin review / import queues  

### Triggers

- Scheduled coverage gaps (city/type under target)  
- Admin “fill district” / bulk import request  
- New official source batch available  
- Update Agent detects possible new entity (not just field change)  

### Permissions

- **Tier T1** — create draft institutions and candidate docs; read catalog  
- Must not publish or change `lifecycleStatus` to Published  
- Must not alter claimed institutions’ owner-controlled fields without Owner/Admin path  

### Human approval requirements

- **Required** before publish of any AI-proposed institution  
- **Required** for NAP field acceptance on first publish  
- Soft-auto allowed only for non-public staging drafts in internal collections  

### KPIs

| KPI | Target direction |
| --- | --- |
| Candidates accepted / proposed | ↑ precision |
| Time draft → publish | ↓ |
| Fake / rejected candidate rate | ↓ |
| Coverage lift in priority cities/types | ↑ |
| Duplicate rate among accepted candidates | ↓ |

### Future MCP integrations

- Web fetch / site map MCP (official sites only, robots-aware)  
- Google Places / Maps enterprise MCP (licensed)  
- Geo taxonomy MCP (city/district normalize)  
- Spreadsheet / CSV import MCP for partner lists  
- Atlas DATA-ACQUISITION pipeline MCP  

---

## 5. Sales Agent

### Mission

Help EduAtlas **activate supply commercially**: encourage unclaimed institutions to claim, and nurture claimed institutions toward premium / featured products — without dark patterns or spam.

### Inputs

- Institution claimStatus, completeness, lead volume  
- Owner contact channels (public email/phone only where allowed)  
- Claim funnel events; prior outreach history  
- Business rules from `BUSINESS-MODEL.md` (what is free vs paid)  
- City/type demand signals from Analytics Agent  

### Outputs

- Prioritized claim outreach lists  
- Personalized outreach draft messages (Turkish)  
- “Why claim” briefs for sales/ops humans  
- Premium upsell suggestions for high-lead owners  
- Campaign segment definitions (not full CRM)  

### Triggers

- New high-lead unclaimed institution  
- Claim rejected → eligible to re-apply after cooldown  
- Completeness threshold crossed (profile “sales-ready”)  
- Weekly activation digest for ops  
- Manual sales queue refresh  

### Permissions

- **Tier T2** — write to outreach queues / draft campaigns; read aggregate lead counts  
- Must not send email/SMS autonomously until messaging provider + consent policy approved  
- Must not read full lead message PII for sales scoring (aggregates only)  

### Human approval requirements

- **Required** for first send of any new outreach template  
- **Required** for bulk sends above a volume threshold  
- Premium pricing changes: never AI-owned  

### KPIs

| KPI | Target direction |
| --- | --- |
| Claim conversion from outreach cohorts | ↑ |
| Outreach → claim request rate | ↑ |
| Unsubscribe / complaint rate | ↓ |
| Premium attach rate among claimed | ↑ |
| Cost per activated claim | ↓ |

### Future MCP integrations

- Email / transactional messaging MCP  
- CRM-lite / HubSpot-style MCP (optional later)  
- Calendar / demo booking MCP  
- Slack / ops digest MCP  
- Billing catalog read MCP (products, not charges)  

---

## 6. Admissions Agent

### Mission

Assist **Institution Owners** in responding to inbound leads faster and more consistently — structured reply drafts and triage — without becoming a full CRM or WhatsApp automation product (MVP non-goal).

### Inputs

- Lead records for institutions the owner is approved to manage  
- Institution profile facts (programs, ages, contact)  
- Owner tone preferences / saved reply templates (future)  
- Lead status, spam flags, language  

### Outputs

- Suggested reply drafts (Turkish)  
- Lead triage labels (urgency, fit, incomplete contact)  
- Checklist prompts (“ask for child age”, “offer visit slot”)  
- Owner coaching tips (response time, completeness)  

### Triggers

- New lead created for a claimed institution  
- Owner opens lead detail in Institution Panel  
- Lead stuck in `new` beyond SLA threshold  
- Owner requests “suggest reply”  

### Permissions

- **Tier T0/T1** — read leads in owner scope; write drafts/suggestions only  
- Must not change lead status unless Owner confirms  
- Must not contact parents directly (no auto-email/SMS from agent)  
- Must not access other institutions’ leads  

### Human approval requirements

- **Required** — Owner must send or accept any parent-facing message  
- Auto-status changes: never without Owner action  
- Admin override paths unchanged  

### KPIs

| KPI | Target direction |
| --- | --- |
| Median time-to-first-response (claimed) | ↓ |
| Draft acceptance rate | ↑ |
| Lead `new` → `contacted` rate | ↑ |
| Owner-reported usefulness | ↑ |
| Hallucinated facts in drafts (audits) | ↓ |

### Future MCP integrations

- Owner Panel tools MCP (lead get/update status via ports)  
- Template library MCP  
- Future WhatsApp Business MCP (explicit product decision; gated)  
- Translation MCP for rare non-Turkish messages  

---

## 7. Quality Agent

### Mission

Continuously score institution and hub **quality** so publish, SEO, and claim priorities reflect completeness, uniqueness, and trust — not vanity volume.

### Inputs

- Institution fields vs publish checklist (`PRD.md` / Domain)  
- Search document completeness  
- Thin-content signals for city/district/type hubs  
- Duplicate and verification scores from sibling agents  
- Historical quality trends  

### Outputs

- Quality score + dimension breakdown (NAP, media, programs, uniqueness)  
- Publish-blocker lists  
- SEO risk flags (boilerplate, doorway risk, thin hub)  
- Prioritized fix queues for Admin and Owners  

### Triggers

- Institution create/update  
- Pre-publish validation  
- Nightly catalog quality sweep  
- Sitemap / index eligibility recompute  
- Post-claim completeness check  

### Permissions

- **Tier T1** — write quality scores, flags, and queue items  
- Must not publish/unpublish alone  
- May recommend `noindex` but Admin/SEO policy applies  

### Human approval requirements

- Unpublish / noindex of previously indexed URLs: **Admin required**  
- Auto-score updates: allowed  
- Blocking publish in CI/admin UI: policy-configurable (human still owns override)  

### KPIs

| KPI | Target direction |
| --- | --- |
| % published meeting completeness bar | ↑ |
| Thin hub rate | ↓ |
| Mean quality score (claimed vs unclaimed) | claimed ≫ unclaimed |
| False-positive publish blockers | ↓ |
| Time-to-remediate critical quality flags | ↓ |

### Future MCP integrations

- SEO crawler / Lighthouse-like MCP  
- Search Console / index status MCP  
- Diff / snapshot MCP for field regressions  
- Atlas quality-rules MCP (shared across products)  

---

## 8. Content Agent

### Mission

Draft **Turkish parent-facing content** that deepens SEO and clarity — institution summaries, hub intros, FAQs — while preserving uniqueness and avoiding spammy generation.

### Inputs

- Institution structured facts (type, geo, programs, verified flags)  
- Hub targets (city, district, type combinations)  
- Brand voice guidelines / banned phrases  
- Existing page text (for rewrite, not duplication across URLs)  
- Quality Agent uniqueness scores  

### Outputs

- Draft `shortDescription` / long description candidates  
- Hub intro / section drafts with `aiGenerated` flag  
- FAQ drafts grounded in facts (no invented tuition/credentials)  
- Internal linking suggestions  

### Triggers

- New published institution missing unique copy  
- Hub page below content-length / uniqueness threshold  
- Owner requests “improve description”  
- Admin content backlog job  

### Permissions

- **Tier T0/T1** — write drafts and suggestions only  
- Must not overwrite published copy without Owner/Admin accept  
- Must not invent phones, prices, accreditations, or MEB codes  

### Human approval requirements

- **Required** for publishing AI copy to indexable pages  
- Owner may accept drafts for their institution after claim approval  
- Hub copy: Admin or designated content editor  

### KPIs

| KPI | Target direction |
| --- | --- |
| Draft accept rate | ↑ |
| Duplicate/boilerplate similarity score | ↓ |
| Organic CTR / engagement on AI-assisted pages (held-out tests) | ↑ or neutral |
| Factual error rate (spot audits) | ↓ |
| Time to fill thin hubs | ↓ |

### Future MCP integrations

- Style-guide / terminology MCP  
- Embedding similarity MCP (uniqueness)  
- CMS / blog MCP for editorial calendar  
- Image alt-text assist MCP (media pipeline)  

---

## 9. Verification Agent

### Mission

Support **trustworthy ownership**: evaluate claim requests and evidence so Admins can approve/reject faster without rubber-stamping fraud.

### Inputs

- `claim_requests` fields (applicant, role, phone, email, message, evidenceUrl)  
- Institution NAP and existing claimStatus  
- Historical claims for same institution / applicant  
- Public corroboration signals (website contact match, domain email)  
- Risk signals (velocity, disposable email, mismatched geo)  

### Outputs

- Verification score + rationale (structured)  
- Evidence checklist (what’s missing)  
- Recommend: approve / reject / need-more-info  
- Fraud / conflict flags (multiple claimants)  

### Triggers

- New claim request → `pending`  
- Evidence URL updated  
- Admin opens claim queue item  
- Suspicious pattern alert from Moderation/Analytics  

### Permissions

- **Tier T3** — read claim queue + related institution; write scores/recommendations only  
- Must not approve/reject claims  
- Must not download/store claim ID documents into public buckets  
- Evidence fetched only into private analysis paths  

### Human approval requirements

- **Always required** for claim approve / reject / revoke  
- Agent recommendation is advisory  
- Dual-control recommended when Admin is also a claimant (`DOMAIN-MODEL.md`)  

### KPIs

| KPI | Target direction |
| --- | --- |
| Median claim pending time | ↓ |
| Admin agreement with agent recommendation | ↑ |
| False approve rate (post-hoc fraud) | ↓ |
| False reject rate (appeals) | ↓ |
| Evidence completeness at first review | ↑ |

### Future MCP integrations

- Private document analysis MCP (PDF/image OCR)  
- Email domain / DNS verification MCP  
- Phone reputation MCP (privacy-reviewed)  
- Case management MCP for Admin claim queue  

---

## 10. Duplicate Agent

### Mission

Detect **duplicate or near-duplicate institutions** and propose safe merge/link actions so SEO and leads are not split across clones.

### Inputs

- Name folded / slug / geo / phone / website fingerprints  
- Search keywords and embeddings (future)  
- Branch vs independent institution rules  
- Historical merge decisions (training signal)  

### Outputs

- Duplicate clusters with confidence  
- Suggested primary survivor record  
- Field-level merge proposals  
- “Not duplicate” suppressions  

### Triggers

- Catalog Agent proposes new candidate  
- Nightly dedupe sweep  
- Admin “find duplicates” for a city  
- Lead/claim attached to suspected clone  

### Permissions

- **Tier T1/T3** — write duplicate clusters and proposals; merge execution is human-gated  
- Must not delete institutions  
- Must not move leads across institutions without Admin merge workflow  

### Human approval requirements

- **Required** for merge, redirect, or unpublish of loser records  
- Auto-suppress of low-confidence pairs: allowed as “suggestions only”  
- SEO redirect map changes: Admin/SEO owner  

### KPIs

| KPI | Target direction |
| --- | --- |
| Precision@k of duplicate pairs | ↑ |
| Duplicate publish incidents | ↓ |
| Merge rollback rate | ↓ |
| Time to resolve high-confidence clusters | ↓ |
| Split-lead rate across clones | ↓ |

### Future MCP integrations

- Entity resolution / clustering MCP  
- Maps place-id linkage MCP  
- Admin merge workflow MCP  
- Search reindex trigger MCP post-merge  

---

## 11. Analytics Agent

### Mission

Turn product and ops telemetry into **actionable insight** for coverage, conversion, SEO, and trust — for humans and for sibling agents’ prioritization.

### Inputs

- Aggregated events (search, profile views, leads, claims)  
- Quality / verification / spam scores  
- Funnel metrics from `BUSINESS-MODEL.md` / PRD goals  
- Anomaly candidates (traffic, error rates, lead floods)  

### Outputs

- Dashboards narratives / weekly digests  
- Priority lists (cities to seed, institutions to claim, hubs to thicken)  
- Anomaly alerts with hypothesized causes  
- Experiment readouts (AI content, outreach cohorts)  

### Triggers

- Scheduled digests (daily/weekly)  
- Metric threshold breach  
- Admin “explain this drop” query  
- Pre-sprint planning export  

### Permissions

- **Tier T0** — read aggregates and non-sensitive metrics; write insight docs / alerts  
- Must not access raw lead message bodies by default  
- Must not change product configuration  

### Human approval requirements

- Insights auto-post to ops channels: allowed if PII-free  
- External public reporting: human review  
- Auto-scaling infra actions: out of scope for this agent  

### KPIs

| KPI | Target direction |
| --- | --- |
| Insight actionability (ops survey) | ↑ |
| Alert precision (true issues) | ↑ |
| Time-to-detect funnel regressions | ↓ |
| Decision latency for coverage priorities | ↓ |

### Future MCP integrations

- GA4 / BigQuery analytics MCP  
- Datadog / Firebase monitoring MCP  
- Spreadsheet / Notion digest MCP  
- Experimentation platform MCP  

---

## 12. Update Agent

### Mission

Keep the catalog **fresh**: detect stale or changed institution facts and propose updates so parents do not act on obsolete NAP or program info.

### Inputs

- Last-verified timestamps, provenance, owner edit history  
- Public website / Maps change signals (policy-compliant)  
- Bounce / user correction reports (`ContactRequest` type correction)  
- Quality Agent staleness dimensions  

### Outputs

- Staleness scores  
- Proposed field patches with before/after + confidence  
- Owner “confirm still correct?” tasks  
- Admin review items for unclaimed institutions  

### Triggers

- TTL since last verified exceeded  
- Source crawl diff detected  
- Correction request linked to institution  
- Post-claim onboarding freshness pass  

### Permissions

- **Tier T1** — write proposed patches and freshness tasks  
- Must not auto-publish NAP changes  
- Claimed institutions: proposals route to Owner first  

### Human approval requirements

- NAP updates: **Owner or Admin required**  
- Non-NAP enrichments on unclaimed drafts: Admin policy may allow staged apply  
- Mass updates: always sampled human review  

### KPIs

| KPI | Target direction |
| --- | --- |
| Median age of last-verified NAP | ↓ |
| Accepted update rate | ↑ |
| Bad update / rollback rate | ↓ |
| Correction-request recurrence | ↓ |
| Owner confirm response rate | ↑ |

### Future MCP integrations

- Diff / crawl MCP  
- Owner notification MCP  
- Source registry MCP (`DATA-ACQUISITION.md` sources)  
- Map listing change-feed MCP  

---

## 13. Moderation Agent

### Mission

Protect trust and SEO by detecting **spam, abuse, fake entities, toxic/unsafe content, and policy violations** across leads, claims, profiles, and UGC-like fields.

### Inputs

- Lead submissions (with rate-limit / honeypot signals)  
- Claim requests and evidence metadata  
- Institution name/description change diffs  
- Contact forms; future reviews/comments  
- Security signals (App Check failures, IP velocity)  

### Outputs

- Spam / abuse scores  
- Recommended lead status (`spam`) or claim risk tags  
- Content policy violations (keyword stuffing, prohibited claims)  
- Escalation packets for Admin  
- Temporary soft-blocks suggestions (never silent ban without policy)  

### Triggers

- Lead/claim/contact create  
- Profile field update on published records  
- Velocity anomaly from Analytics  
- User report  

### Permissions

- **Tier T2** — may auto-mark obvious lead spam under strict rules; otherwise recommend  
- Must not ban users or revoke Auth roles  
- Must not approve claims  
- Must not delete catalog entities  

### Human approval requirements

- Account disable / role revoke: **Admin/Super Admin**  
- Unpublish for SEO spam: Admin  
- Auto-spam on leads: allowed only with high-precision rules + audit; Owner/Admin can override  
- Legal takedowns: human-only  

### KPIs

| KPI | Target direction |
| --- | --- |
| Spam precision / recall | ↑ both (tuned) |
| Owner false-spam complaints | ↓ |
| Time-to-triage abuse queue | ↓ |
| SEO spam incidents indexed | ↓ |
| Lead flood containment time | ↓ |

### Future MCP integrations

- Abuse signal MCP (device, IP risk — privacy-reviewed)  
- Content safety classifier MCP  
- Security audit log MCP  
- Admin moderation queue MCP  

---

## 14. Cross-agent collaboration

Agents collaborate through **shared queues and scores**, not by sharing unconstrained memory.

```text
Catalog ──► Duplicate ──► Quality ──► Content ──► (Human publish)
   │            │            │
   └────────────┴────────────┴──► Sales (activation priority)

Claim submit ──► Verification + Moderation ──► Admin decision
Lead create   ──► Moderation ──► Admissions (if claimed)
Update diffs  ──► Quality + Verification (if ownership-sensitive)

Analytics ◄── scores/events from all agents ──► priority inputs to all agents
```

| Pattern | Rule |
| --- | --- |
| **No circular silent writes** | Agent A’s output is B’s input only via versioned artifacts |
| **Conflict resolution** | Admin merge/claim decisions beat agent suggestions |
| **Budgeting** | Orchestrator enforces token/cost quotas per agent per day |
| **Fail closed on trust paths** | Claim/lead privilege paths degrade to human queue on agent outage |

---

## 15. Human-in-the-loop matrix (summary)

| Action | Agent may propose | Auto-apply | Human required |
| --- | --- | --- | --- |
| Create draft institution | Catalog | Yes (draft only) | Publish: Admin |
| Publish institution | Quality/Content assist | No | Admin |
| Edit published NAP | Update/Catalog | No | Owner/Admin |
| Merge duplicates | Duplicate | No | Admin |
| Approve/reject claim | Verification | No | Admin |
| Mark lead spam | Moderation | Conditional | Override: Owner/Admin |
| Send parent message | Admissions | No | Owner |
| Send claim outreach email | Sales | No (initially) | Ops/Sales |
| Unpublish / noindex | Quality/Moderation | No | Admin |
| Change roles / billing | — | No | Super Admin / Billing |

---

## 16. Security, privacy & compliance

| Concern | Control |
| --- | --- |
| **PII in prompts** | Minimize; hash identifiers; redact messages in Analytics |
| **Claim documents** | Private storage; Verification Agent only; never public URLs |
| **Audit** | Every privileged recommendation and every auto-spam action logged |
| **Prompt injection** | Treat web-fetched and user text as untrusted; tool allowlists |
| **Secrets** | Model keys only in Secret Manager / server runtime |
| **KVKK** | No training on lead PII for external models without legal basis; retention aligned with `SECURITY-ARCHITECTURE.md` |
| **App Check** | Public write paths remain protected; agents are not a bypass |

---

## 17. Future MCP integration map

MCP (Model Context Protocol) is the preferred long-term way agents gain tools — keeping EduAtlas core free of ad-hoc scrapers and aligning with Atlas OS.

| MCP domain | Used by | Notes |
| --- | --- | --- |
| Firebase Admin / Firestore ports | Most agents | Via application repositories, not raw UI |
| Web fetch / crawl | Catalog, Update, Content | Robots/ToS aware |
| Maps / Places | Catalog, Duplicate, Update | Licensed usage |
| Email / messaging | Sales, Admissions (later) | Consent + templates |
| Analytics warehouses | Analytics | Aggregates first |
| Document OCR | Verification | Private |
| Search / reindex | Duplicate, Quality, Content | Post-change hooks |
| Ops chat (Slack) | Sales, Analytics, Moderation | Digests & alerts |
| Atlas CLI / templates | All (meta) | Scaffold agent modules consistently |

EduAtlas may expose **first-party MCP servers** (institutions.search, leads.listOwned, claims.enqueueReview) so agents and external Atlas tools share one AuthZ boundary.

---

## 18. Phased roadmap (non-binding schedule)

| Phase | Focus | Agents (thin slice) |
| --- | --- | --- |
| **P0 — Foundations** | Ports, audit, draft flags, no auto-publish | Quality scoring stubs; Moderation spam heuristics |
| **P1 — Trust & catalog** | Claim assist + dedupe + drafts | Verification, Duplicate, Catalog (candidates) |
| **P2 — SEO content** | Hub/institution draft copy with approval UX | Content, Quality gates |
| **P3 — Activation** | Claim outreach + owner reply assist | Sales, Admissions |
| **P4 — Freshness** | Change detection loops | Update |
| **P5 — Orchestration** | Multi-agent routing, budgets, MCP mesh | Analytics + orchestrator |

MVP product scope remains valid until a sprint explicitly activates an agent behind a feature flag.

---

## 19. Explicit non-goals (workforce)

- Public parent-facing AI counselor / chatbot (PRD non-goal for MVP).  
- Fully autonomous claim approval.  
- Fully autonomous NAP mutation on published pages.  
- Full institution CRM / marketing automation suite.  
- Shadow ranking that sells placement without disclosure (`BUSINESS-MODEL.md`).  
- Training public models on confidential leads/claims without legal review.

---

## 20. Success criteria for the AI workforce program

The workforce is succeeding when:

1. **Coverage** grows faster than manual ops alone, with duplicate/fake rates under control.  
2. **Claim pending time** drops while fraud does not rise.  
3. **Lead response** improves for claimed institutions without unsolicited parent spam.  
4. **Index quality** improves (fewer thin/boilerplate pages).  
5. **Humans stay in charge** of publish, merge, claim decision, and NAP.  
6. Agents remain **replaceable modules** behind ports — swappable models/tools without rewriting Domain.

---

**Summary:** EduAtlas’s long-term AI architecture is a **permissioned workforce of ten specialized agents** — Catalog, Sales, Admissions, Quality, Content, Verification, Duplicate, Analytics, Update, and Moderation — that **propose and prioritize** at scale, integrate via **ports and future MCP tools**, and never silently own **publish, claim approval, or NAP truth**. This document is the permanent AI roadmap; implementation lands only when later sprints explicitly activate each agent behind governance gates.
