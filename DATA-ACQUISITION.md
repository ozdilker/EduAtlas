# EduAtlas — Data Acquisition Strategy

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | DATA-ACQUISITION.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Task** | Task-006 |
| **Status** | Binding strategy for catalog growth & data ops |
| **Market** | Türkiye |
| **Scale goal** | Every educational institution in Türkiye (phased) |
| **Last updated** | 13 July 2026 |

---

## Document control

This document defines **how institution data enters, improves, and stays current** in EduAtlas. It is the operational counterpart to:

| Document | Relationship |
| --- | --- |
| `PRD.md` | Publish rules, MVP categories, claim/lead flows |
| `DOMAIN-MODEL.md` | Institution and related entities, lifecycles |
| `SEO-ARCHITECTURE.md` | Index gates, NAP, thin-content avoidance |
| `BUSINESS-MODEL.md` | Seed → claim → activation funnel |

**Principle:** Acquisition without quality destroys SEO and trust. Every path into the catalog must pass **normalization → validation → moderation → publication**, then **continuous update**.

---

## 1. Objectives

1. Build launch coverage for MVP types (≥ 500 published institutions; priority cities).  
2. Scale toward **national completeness** across all education segments over time.  
3. Prefer **claimable, correct, unique** records over raw volume.  
4. Make **InstitutionOwner updates** the long-term primary freshness engine.  
5. Keep a clear audit trail: source, ownership class, verification, last verified.  
6. Remain legally and ethically defensible (terms of sources, copyright, KVKK).

### 1.1 Phased coverage

| Phase | Scope | Acquisition emphasis |
| --- | --- | --- |
| **MVP** | Private schools, dershane, etüt, language schools, kindergarten, preschool | Manual + Maps/web seed + admin |
| **Expand** | Additional K–12 / course verticals | Semi-automated discovery + claims |
| **National** | Broader education graph (incl. universities when product opens) | MEB/YÖK-aligned reference + AI assist |
| **Complete** | “Every institution in Türkiye” aspiration | Continuous discovery + owner network |

MVP does **not** require MEB/YÖK completeness or university inventory; those sources are specified for long-term readiness.

---

## 2. Data sources

### 2.1 Source catalog

| ID | Source | Type | Trust baseline | MVP use | Notes |
| --- | --- | --- | --- | --- | --- |
| S1 | **Official institution websites** | Primary web | High for self-published NAP | Yes | Prefer for name, address, phone, programs |
| S2 | **Google Maps** | Discovery / geo | Medium | Yes | Discovery & geo hints; not sole publish proof |
| S3 | **Google Business Profile** | Local listing | Medium–high | Yes | NAP cross-check; hours; categories |
| S4 | **MEB** (Milli Eğitim Bakanlığı) | Official registry / public lists | Very high (when applicable) | Later / selective | Schools under MEB scope; licensing signals |
| S5 | **YÖK** | Official higher-ed | Very high | Future vertical | Universities / programs when in scope |
| S6 | **University websites** | Institutional | High | Future | Faculties, programs, campuses |
| S7 | **Institution submissions** | First-party claim / forms | High after verify | Yes | Claim flow + profile edits |
| S8 | **Manual administration** | Human ops | High (process-dependent) | Yes | Seed, cleanup, moderation |
| S9 | **Future AI discovery** | Assisted crawl / extract | Variable | Reserved | Always human-gated before index |
| S10 | **Directories / open web** (secondary) | Aggregators, citations | Low–medium | Sparse | Never sole source for publish |
| S11 | **Social profiles** (Instagram etc.) | Marketing presence | Low for NAP | Optional | Soft signals only |
| S12 | **Community / ContactRequest corrections** | User reports | Low until verified | Yes (ingest) | Feeds moderation queue |

### 2.2 Source descriptions

#### Official institution websites (S1)

- **Use for:** legal/common name, address, phone, email, website canonical, program blurbs, logo (copyright-aware).  
- **Limits:** outdated sites, parked domains, brochureware without NAP.  
- **Rule:** If website and Maps disagree, prefer website **or** require human adjudication.

#### Google Maps (S2)

- **Use for:** discovery of candidates, coordinates, rough category, popular name variants.  
- **Limits:** ToS/compliance constraints on bulk extraction; stale pins; chains mis-pin.  
- **Rule:** Maps-only records stay **Draft** until second-source validation or admin approval.

#### Google Business Profile (S3)

- **Use for:** NAP consistency, working hours, primary category, photos (copyright-aware).  
- **Limits:** Owner neglect; category misuse (“school” as spam).  
- **Rule:** Treat as supporting evidence for verification, not EduAtlas ownership of GBP.

#### MEB (S4)

- **Use for:** existence/licensing signals for schools in MEB’s public scope; official naming.  
- **Limits:** Coverage ≠ all MVP types (dershane/dil/kreş may differ); update lag; format changes.  
- **Rule:** MEB match raises verification confidence; absence does not auto-reject private/course entities.

#### YÖK (S5) & university websites (S6)

- **Use for:** future university vertical, program catalogs, campus identity.  
- **Rule:** Out of MVP publish scope; pipeline design must not block later ingest.

#### Institution submissions (S7)

- **Use for:** claim packages, profile edits, media uploads, program lists.  
- **Rule:** Changes to sensitive fields (name, location) may require admin re-approval (per PRD recommendation).

#### Manual administration (S8)

- **Use for:** launch seed, dedupe decisions, spam removal, bulk import QA.  
- **Rule:** Every admin create/edit stores `createdBy` / `updatedBy` and source tag `manual_admin`.

#### Future AI discovery (S9)

- **Use for:** candidate finding, field extraction drafts, broken-link detection, category suggestions, summaries.  
- **Rule:** AI output is **proposal-only** until moderation; never auto-publish to indexable state.

---

## 3. Data ownership

Ownership here means **authoritative control and liability**, not only database write access.

### 3.1 Ownership classes

| Class | Definition | Examples | Who may change | Public display |
| --- | --- | --- | --- | --- |
| **Official data** | Derived from government/registry sources | MEB school code match, YÖK program lists | Admin / system sync with audit | Yes when validated |
| **Institution-provided data** | Submitted by approved InstitutionOwner or claim docs | Description, hours, WhatsApp, logos they upload | InstitutionOwner (+ Admin override) | Yes when Published |
| **Community-generated data** | Unverified public input | Correction reports, future reviews | Admin moderation; author limited | Only after accept |
| **System-generated data** | Computed by EduAtlas | Slugs, quality score, SEOPage shells, embeddings (future), dedupe keys | System (+ Admin tune) | Scores mostly internal |

### 3.2 Field-level ownership (Institution)

| Field group | Default owner class | Notes |
| --- | --- | --- |
| Name, type, city, district, address | Official or Admin seed → Institution after claim | Name changes gated |
| Phone, email, WhatsApp, website | Institution-provided preferred | Cross-check vs official/web |
| Description, programs summary | Institution-provided | Anti-spam / keyword-stuff moderation |
| Logo / gallery | Institution-provided | Copyright attestation |
| Claim status, verification flags | System + Admin | Not editable by owner directly |
| Quality score, popularity | System-generated | Internal / limited display |
| Reviews (future) | Community-generated | Moderated |

### 3.3 Platform custody

EduAtlas retains **platform custody** of all catalog records (including unclaimed listings). InstitutionOwner has **editorial ownership** after approval; Admin retains override, unpublish, and revoke.

Leads and ContactRequests are **PII under platform custody** (see PRD/business model)—not “institution-owned data” for resale.

---

## 4. Data pipeline

End-to-end flow for every institution record:

```text
Discovery
   ↓
Normalization
   ↓
Validation
   ↓
Moderation
   ↓
Publication
   ↓
Continuous updates
```

### 4.1 Discovery

**Goal:** Find candidate institutions and minimal identifying attributes.

| Input | Output |
| --- | --- |
| Maps/web/MEB/YÖK/AI/manual lists | `CandidateInstitution` (or Institution in `Draft`) |
| Required minimum | Name + city (district if known) + source pointer |

**Activities**

- Geographic sweeps (priority districts first).  
- Type-targeted discovery (e.g., anaokulu in Kadıköy).  
- Import batches with source IDs.  
- Inbound claim “create if missing” (careful dedupe).  
- Correction/ContactRequest suggesting missing venues.

**Exit criteria:** Candidate has enough identity to attempt dedupe against existing catalog.

### 4.2 Normalization

**Goal:** Canonicalize fields so search, SEO, and dedupe work.

See §5 for field rules.  
**Exit criteria:** Normalized name, phone, address parts, cityId/districtId resolved or flagged unresolved.

### 4.3 Validation

**Goal:** Machine-checkability before human time.

| Check | Fail action |
| --- | --- |
| City/district consistency | Block publish; queue fix |
| Phone/email format | Flag or block |
| Website reachable (soft) | Warning; not always block |
| Required publish fields incomplete | Remain Draft |
| Type in allowed taxonomy | Block / remap |
| Suspected duplicate | Hold for dedupe review |

**Exit criteria:** `validationStatus = passed | passed_with_warnings | failed`.

### 4.4 Moderation

**Goal:** Human (or tiered) judgment for trust and SEO safety.

| Queue | Examples |
| --- | --- |
| New seed publish | First-time publish to index |
| Dedupe conflicts | Confidence mid-band |
| Claim verification | Ownership proof |
| Spam / fake | Nonsense names, lead farms |
| Sensitive edits | Name/geo changes post-claim |
| AI proposals | Accept / edit / reject |

**Exit criteria:** Moderator decision recorded with reason codes.

### 4.5 Publication

**Goal:** Make the institution publicly discoverable per PRD + SEO architecture.

Preconditions (aligned with PRD):

- Lifecycle → `Published`  
- Required fields complete  
- Not a duplicate survivor conflict  
- SEOPage institution + hub index gates satisfiable  

**Effects:** appears in search; eligible for sitemap; canonical `/kurum/{slug}` live.

### 4.6 Continuous updates

**Goal:** Prevent rot after publish.

Triggers:

- Owner dashboard edits  
- Scheduled freshness jobs  
- Broken-link / phone checks  
- AI “stale suspicion” flags  
- Community correction reports  
- Official source resync (MEB/YÖK when connected)  

Unpublish or `noindex` if quality collapses below policy (e.g., confirmed closed).

---

## 5. Normalization

All normalizers are **deterministic where possible** and store both `raw*` and `normalized*` when useful for audit.

### 5.1 Phone numbers

| Rule | Spec |
| --- | --- |
| Target format | E.164 storage (`+90…`); display format local `0XXX XXX XX XX` |
| Strip | Spaces, dashes, dots, parentheses |
| Trunk prefix | Convert leading `0` to `+90` |
| Multi-phone | Primary + secondary array; primary required for many publish paths |
| Invalid | Fail validation if neither phone nor email satisfies PRD contact rule |

### 5.2 Addresses

| Rule | Spec |
| --- | --- |
| Structure | `street` + `districtId` + `cityId` + optional `postalCode` |
| Free text | Keep `addressLine` for display; parse what is reliable |
| Floor/apt noise | Preserve in line; do not invent |
| PO Box only | Flag low quality |

### 5.3 Cities

| Rule | Spec |
| --- | --- |
| Resolve to | `City` entity (`slug`, plate code) |
| Aliases | Map `Ist.`, `İstanbul`, `Istanbul` → same city |
| Unknown | Do not publish; quarantine |

### 5.4 Districts

| Rule | Spec |
| --- | --- |
| Resolve to | `District` under correct `cityId` |
| Aliases | Neighborhood ≠ district; map common mistakes via alias table |
| Conflict | If district not in city → validation fail |

### 5.5 Institution names

| Rule | Spec |
| --- | --- |
| Display name | Preserve official casing/Turkish chars |
| Match key | Lowercase ASCII-folded, strip legal suffixes noise (`ltd`, `şti`, `a.ş.` variants) for dedupe |
| Keyword stuffing | Reject names like `Kadıköy Anaokulu Ens İyi Fiyat` in moderation |
| Branch suffix | Prefer Branch entity over encoding campus in name when possible |

### 5.6 Website URLs

| Rule | Spec |
| --- | --- |
| Canonical | HTTPS preferred; strip tracking params; lowercase host |
| Trailing slash | Normalize |
| Social-only | If Instagram URL given as “website”, store under social, not website |
| Parked / for-sale | Flag |

### 5.7 Social media

| Rule | Spec |
| --- | --- |
| Store | Platform + normalized profile URL/handle |
| Platforms | Instagram, Facebook, YouTube, LinkedIn, X (as available) |
| Role | Supporting evidence; not NAP source of truth |

### 5.8 Emails

| Rule | Spec |
| --- | --- |
| Normalize | Lowercase domain; trim |
| Prefer | Domain matching website |
| Freewebmail | Allowed but lower verification weight |
| Role accounts | `info@`, `iletisim@` preferred over personal Gmail for claims |

### 5.9 Working hours

| Rule | Spec |
| --- | --- |
| Structure | Per-weekday open/close or “closed”; timezone `Europe/Istanbul` |
| Sources | GBP / website / owner |
| 24/7 education claims | Skeptical moderation |
| Missing hours | Allowed for MVP publish (optional field) |

---

## 6. Deduplication

### 6.1 Goal

One real-world institution → **one surviving Published Institution** (branches modeled separately).

### 6.2 Detection signals

| Signal | Weight (illustrative) |
| --- | --- |
| Exact normalized phone match | Very high |
| Exact website domain match | Very high |
| Geo proximity + similar name | High |
| Same city/district + high name similarity | High |
| Shared social profile URL | Medium–high |
| MEB/YÖK official ID match | Decisive when present |
| Same Maps place id (if stored) | Very high |
| Email domain + geo | Medium |

### 6.3 Confidence score

```text
duplicateConfidence ∈ [0, 1]
```

| Band | Action |
| --- | --- |
| ≥ 0.90 | Auto-merge candidate **or** hard-block second publish (policy: prefer **queue**, auto-merge only when IDs identical) |
| 0.70–0.89 | Mandatory manual review |
| 0.40–0.69 | Soft flag; allow publish with watchlist |
| < 0.40 | Treat as distinct |

**Recommended MVP policy:** No silent auto-merge. Auto-**block** create when ≥ 0.90 with existing Published twin; force merge UI for Admin.

### 6.4 Merge rules

When merging A (survivor) and B (duplicate):

1. Prefer verified / claimed / higher quality score as survivor.  
2. Union non-conflicting fields; conflicts → moderator pick.  
3. 301 SEO: `/kurum/{losing-slug}` → survivor canonical.  
4. Reattach leads, claims, media to survivor.  
5. Record merge event in verification/history log.

### 6.5 Branch vs duplicate

| Case | Model |
| --- | --- |
| Same brand, different campus | `InstitutionBranch` or separate Institution if legally separate—decision matrix in ops playbook |
| Same pin, two names | Likely duplicate |
| Franchise separately owned | Separate Institution; optional Category/brand tag (future) |

### 6.6 Manual review checklist

- Phones equal?  
- Independent websites?  
- Distinct tax identity / signage (if available)?  
- Parents would consider them different places?

---

## 7. Verification

Verification is **orthogonal** to claim and to publish, but they interact.

### 7.1 States & flags

| Concept | Meaning |
| --- | --- |
| **Institution claimed** | `claimStatus = claimed` with approved `InstitutionOwner` |
| **Institution verified** | EduAtlas attests core identity/NAP is trustworthy above baseline |
| **Official source** | Linked/matched to MEB/YÖK/other registry ID when applicable |
| **Last verified** | Timestamp of last successful verification event |
| **Verification history** | Append-only log of checks and outcomes |

Claimed ≠ Verified.  
Unclaimed can still be Published (seed).  
Verified can be unclaimed (admin-validated seed).

### 7.2 Verification levels (recommended)

| Level | Label | Typical evidence |
| --- | --- | --- |
| V0 | Unverified | Single weak source |
| V1 | Soft-verified | Website + Maps NAP agree |
| V2 | Strong-verified | V1 + reachable phone/email OR official ID |
| V3 | Owner-verified | Approved claim + confirmed contact channel |
| V4 | Official-matched | MEB/YÖK (or equivalent) ID bound |

### 7.3 Verification history record (conceptual)

Each event stores: `at`, `actor` (admin/system/owner), `method`, `fromLevel`, `toLevel`, `evidenceRefs`, `notes`.

### 7.4 Business rules

1. Raising to V3 requires claim approval path.  
2. Losing claim (revoke) does not automatically wipe V1/V2.  
3. Proven closed → Archive + verification note `closed`.  
4. Public “verified” badge (if shown) only at ≥ V2 or V3—product decision; avoid badge inflation.

---

## 8. Update strategy

### 8.1 Channels

| Channel | Description | Priority |
| --- | --- | --- |
| **Institution dashboard** | Owner edits profile/media/hours | Primary long-term |
| **Manual admin** | Ops fixes, merges, enforcement | Always |
| **Automatic jobs** | Link checks, normalization repairs, hub recounts | Continuous |
| **Scheduled checks** | Periodic re-validation of priority / stale records | Continuous |
| **AI assistant** | Proposals for stale fields, summaries, categories | Future / assist |
| **Official resync** | MEB/YÖK differential updates | When integrated |
| **Community reports** | ContactRequest corrections | Triage |

### 8.2 Automatic updates (safe)

Allowed without human approval:

- Recompute quality score, popularity, slug suggestions (slug apply still gated)  
- Sitemap membership from publish flags  
- Soft warnings (broken website)  
- Alias table improvements  

Not allowed automatically (MVP):

- Changing phone/address/name to AI-guessed values  
- Auto-publish new institutions from crawl  
- Auto-merge mid-confidence duplicates  

### 8.3 Freshness SLA (policy targets)

| Segment | Target max staleness |
| --- | --- |
| Claimed + active leads | Owner-driven; nudge at 90 days no edit |
| Priority district unclaimed | Review every 180 days |
| Long-tail | Best effort / event-driven |

### 8.4 Closed / moved institutions

- Mark Archived; retain history.  
- 301 to city×type or district×type hub if no successor; if successor campus, 301 to new institution.  
- Remove from indexable sitemaps.

---

## 9. Quality score

### 9.1 Purpose

A single **Data Quality Score** `Q ∈ [0, 100]` prioritizes moderation, claim outreach, and SEO trust—not public ranking manipulation without disclosure.

### 9.2 Components

| Component | Weight | Definition |
| --- | --- | --- |
| **Completeness** | 30% | % of required + recommended fields filled |
| **Verification** | 25% | Verification level V0–V4 mapped to points |
| **Freshness** | 20% | Decay by time since `lastVerified` or last meaningful edit |
| **Consistency** | 15% | Cross-source NAP agreement; city/district coherence; schema match |
| **Popularity** | 10% | Engagement proxy (views, leads, search demand)—capped so spam cannot dominate |

```text
Q = 0.30*Completeness + 0.25*Verification + 0.20*Freshness
  + 0.15*Consistency + 0.10*Popularity
```

### 9.3 Completeness checklist (illustrative)

Required (publish): name, type, city, district, address, description, phone|email, slug.  
Recommended: website, WhatsApp, hours, logo, programs summary, geo coordinates.

### 9.4 Operating thresholds

| Score | Action |
| --- | --- |
| Q < 40 | Do not publish (or unpublish if degraded) |
| 40–69 | Publish allowed; outreach / improve queue |
| 70–84 | Healthy |
| ≥ 85 | Prefer for featured editorial modules (still not paid rank) |

### 9.5 Transparency

Internal dashboards show component breakdown. Public pages may show claim/verification badges—not raw Q—unless product later decides otherwise.

---

## 10. Media

### 10.1 Asset types

| Type | Use | Notes |
| --- | --- | --- |
| **Logo** | Cards, institution header, OG fallback | Prefer square/transparent |
| **Images** | Gallery, cover | Facility photos; no stock spam |
| **Videos** | Future tour embeds | Link or hosted; copyright |
| **Documents** | Claim proof (PDF); brochures | Proof docs **not public** by default |

### 10.2 Ingest rules

- Virus/malware scan on upload.  
- Size/type allowlists.  
- Strip EXIF GPS if privacy policy requires.  
- Associate `source` + `uploadedBy` + license attestation.

### 10.3 Copyright considerations

| Rule | Detail |
| --- | --- |
| Owner uploads | Attest rights to use on EduAtlas |
| Scraped images | **Default forbidden** for publish without license clarity |
| GBP/Maps photos | Do not bulk republish as own CDN assets without legal clearance |
| MEB/YÖK emblems | Respect official emblem usage rules |
| Takedown | Process for copyright complaints (notice → remove → log) |

### 10.4 SEO / performance

- Unique alt text when informative.  
- Do not index document storage URLs.  
- Placeholders allowed for MVP seed (quality score penalty).

---

## 11. AI (future agents)

AI is an **accelerator inside the pipeline**, not an authority.

### 11.1 Agent capabilities (planned)

| Agent | Function | Auto-apply? |
| --- | --- | --- |
| **Discovery agent** | Find candidate institutions on the web | No — candidates only |
| **Extraction agent** | Propose NAP/programs from website HTML | No — draft fields |
| **Broken link agent** | Detect dead websites / 404 | Yes — warnings; No — field wipes |
| **Staleness agent** | Detect outdated hours/names vs sources | No — flags |
| **Summary agent** | Draft parent-facing descriptions | No — moderation |
| **Category agent** | Suggest InstitutionType / Category | No — suggestions |
| **Dedupe agent** | Suggest merge pairs + confidence | Assist review |
| **SEO copy agent** | Hub intro drafts | Human approve before index |

### 11.2 Guardrails

1. Persist `aiGenerated=true` on drafted fields.  
2. Never invent phone numbers or addresses.  
3. Never auto-create indexable SEO hubs from AI-only content.  
4. Rate-limit crawling; honor legal/ToS constraints.  
5. KVKK: do not scrape personal teacher home addresses into public fields.

---

## 12. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Incorrect data** | Bad leads, trust loss, SEO complaints | Dual-source validation; claim updates; Q thresholds |
| **Duplicate institutions** | Split reviews/leads; thin SEO | Dedupe confidence + merge 301s |
| **Copyright** | Legal exposure | No unauthorized media scrape; attestation; takedown |
| **Spam** | Catalog pollution | Moderation queues; rate limits; Q floors |
| **Fake institutions** | Fraudulent leads | Verification levels; claim checks; unpublish fast |
| **SEO abuse** | Doorway names, spun descriptions | Name policy; uniqueness checks; unpublish |
| **Source ToS violation** | Legal / block | Prefer official/first-party; cautious Maps usage; legal review |
| **Over-automation** | Industrial-scale errors | Human gates on publish/merge |
| **Stale national registries** | False confidence | `lastVerified`; don’t treat registry as realtime truth alone |
| **PII leakage in docs** | KVKK incident | Private storage for claim documents |

---

## 13. Success metrics

| Metric | Definition | Direction |
| --- | --- | --- |
| **Institutions indexed** | Published + indexable institutions in sitemap / SC | ↑ to national scale |
| **Verified institutions** | Count at ≥ V2 (or agreed level) | ↑ share of published |
| **Average completeness** | Mean completeness component / field fill rate | ↑ |
| **Average freshness** | Mean freshness component or median days since verify/edit | ↑ freshness (↓ age) |
| **Duplicate ratio** | Suspected+confirmed dupes / total institutions | ↓ (target near 0 confirmed open dupes) |
| **Claim rate** | Claimed / published | ↑ |
| **Publish throughput** | Institutions published / week | ↑ without Q collapse |
| **Moderation SLA** | Median time in moderation queues | ↓ |
| **Reject / spam rate** | Rejected candidates / discovered | Watch (context-dependent) |
| **Post-publish correction rate** | Critical NAP fixes after publish | ↓ over time |

### 13.1 Launch alignment

Support PRD targets: ≥ 500 published MVP-type institutions; priority city coverage; quality sufficient for SEO index gates (no empty hubs, no duplicate spam).

---

## 14. Operating model

### 14.1 Roles

| Role | Responsibilities |
| --- | --- |
| Data ops / Admin | Seed, moderate, merge, verify |
| InstitutionOwner | Update after claim |
| SEO owner | Enforce uniqueness / thin-content policy |
| Engineering | Pipelines, normalizers, scores, audit logs |
| Legal | Source usage, copyright, KVKK |

### 14.2 Priority order for MVP seeding

1. District density in İstanbul / Ankara / İzmir for MVP types.  
2. Completeness over raw count once gate of usefulness passed.  
3. Claim outreach on highest traffic profiles.  
4. Dedupe hygiene before large batch imports.

### 14.3 Record provenance (minimum)

Every Institution should retain:

- `sources[]` (type, url/id, retrievedAt)  
- `ownershipClass` per field group where relevant  
- `verificationLevel`, `lastVerifiedAt`  
- `qualityScore` + components  
- lifecycle + claim status  

---

## 15. Out of scope (for this strategy doc)

- Implementation code, scrapers, or concrete APIs  
- Exact vendor selection for enrichment  
- Tuition/pricing databases as acquisition mandate  
- Parent PII acquisition beyond lead forms  

---

## 16. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| Data / Ops | | | ☐ |
| Engineering | | | ☐ |
| Legal (sources & media) | | | ☐ |

**Summary:** EduAtlas acquires institutions from **web, Maps/GBP, official registries, owners, and admins** (AI later as assistant), normalizes and deduplicates them, verifies with explicit levels, publishes only quality-gated records, and keeps them fresh primarily through **institution dashboards** plus scheduled and assisted checks—at a scale aimed at **every educational institution in Türkiye**, without sacrificing trust or SEO integrity.
