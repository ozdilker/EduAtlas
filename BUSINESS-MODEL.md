# EduAtlas — Business Model

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | BUSINESS-MODEL.md |
| **Version** | 1.0 |
| **Sprint** | Sprint-001 — Foundation |
| **Market** | Türkiye |
| **Last updated** | 13 July 2026 |

---

## Document control

This document describes **how EduAtlas creates, delivers, and captures value**. It is the commercial counterpart to `PRD.md` (product scope) and `DOMAIN-MODEL.md` (entities).

| Related document | Role |
| --- | --- |
| `PROJECT-DASHBOARD.md` | Milestone and release framing |
| `PRD.md` | MVP features; payments out of MVP |
| `DOMAIN-MODEL.md` | Lead, Campaign, premium flags, ownership |

**Commercial principle (locked):**  
Parents and students use EduAtlas **free**. Revenue comes from **institutions** (and later advertisers) who pay for demand access, visibility, and tools. MVP ships **without billing**; monetization activates after product–market proof on leads and organic traffic.

---

## 1. Business model summary

EduAtlas is a **two-sided education marketplace**:

| Side | Role | Pays? |
| --- | --- | --- |
| **Demand** | Parents & students discover, compare, contact institutions | No |
| **Supply** | Private schools, dershaneler, etüt merkezleri, language schools, kindergartens, preschools | Yes (post-MVP) |
| **Platform** | EduAtlas aggregates catalog, SEO demand, claims, and lead routing | Captures value |

**Flywheel**

```text
More institutions → better local SEO coverage → more parent traffic
        ↑                                              ↓
More claims & paid plans ←── more qualified leads ←────┘
```

**Model type:** SEO-led lead generation + freemium SaaS for institutions, with advertising as a later layer.

---

## 2. Customer segments

### 2.1 Demand-side (non-paying)

| Segment | Description | Value to EduAtlas |
| --- | --- | --- |
| **Parents** | Primary decision-makers for preschool, kindergarten, private school, etüt | Highest lead quality; core SEO intent |
| **Students** | Older learners choosing dershane, etüt, language school | Volume + seasonal peaks (exam cycles) |
| **Relatives / advisors** | Grandparents, agents helping families | Secondary traffic; same lead forms |

Demand never pays in the core model. Trust and conversion quality matter more than demand monetization (no parent subscriptions in plan).

### 2.2 Supply-side (paying customers)

| Segment | Examples | Willingness to pay (expected) | Notes |
| --- | --- | --- | --- |
| **A — High CAC locals** | Anaokulu, kreş, small dil okulu | Medium–high per enrolled student | Strong ROI if leads convert to visits |
| **B — Seasonal volume** | Dershane, YKS-focused etüt | High in peak months | Budget follows enrollment seasons |
| **C — Brand / multi-branch** | Chain private schools, large language brands | High for premium + brand control | Care about claim, accuracy, multi-location later |
| **D — New entrants** | Newly opened centers | High for discovery | Need visibility before word-of-mouth |

### 2.3 Indirect / future buyers

| Segment | Role |
| --- | --- |
| **Education advertisers** | Edtech, publishers, exam prep brands buying awareness on hubs |
| **Franchise / group HQ** | Centralized billing for many branches |
| **Agencies** | Managing profiles/leads on behalf of institutions |

### 2.4 Who is *not* a customer (MVP commercial focus)

- Public schools (out of launch catalog)
- Universities (out of launch catalog)
- Parents as subscribers

---

## 3. Value propositions (commercial lens)

| Audience | Job to be done | EduAtlas offer | Why they pay / stay |
| --- | --- | --- | --- |
| Parents | Find & contact the right local institution | Free search + profiles + one request form | Better than Instagram DMs / thin directories |
| Institutions | Get qualified inquiries and own their web presence | Claimed profile + lead inbox (+ later premium) | Pay for leads/visibility that convert |
| Platform | Own category search demand in Türkiye education | SEO hubs + catalog network effects | Compounding organic asset |

---

## 4. Revenue streams

Phased intentionally. **Phase 0 = MVP (no revenue collection).**

### 4.1 Phase map

| Phase | Timing (indicative) | Revenue active? | Focus |
| --- | --- | --- | --- |
| **0 — Prove** | Launch → ~90 days | No | Traffic, institutions, claims, lead volume/quality |
| **1 — Monetize leads & membership** | After proof metrics | Yes | Lead products + Premium |
| **2 — Scale** | After repeatable sales | Yes | Advertising, packages, multi-branch |

### 4.2 Stream catalog

| ID | Stream | Type | Phase | Description |
| --- | --- | --- | --- | --- |
| R1 | **Lead monetization** | Usage / performance | 1 | Institutions pay for delivered or unlocked leads |
| R2 | **Premium memberships** | Subscription | 1 | Monthly/annual plan for visibility + tools |
| R3 | **Featured / boosted placement** | Placement fee | 1–2 | Paid rank or spotlight on hub/search (disclosed) |
| R4 | **Advertising** | Media | 2 | Third-party or self-serve ads on SEO hubs |
| R5 | **Profile services** | Services | 1–2 | Optional setup, copy, photo, claim concierge (ops-light) |
| R6 | **Enterprise / groups** | Contract | 2 | Multi-campus billing, API/reporting (future) |

**Out of model (near term):** tuition processing, commission on enrollment, parent fees, data resale of PII.

### 4.3 Revenue mix (target direction, not forecast)

After Phase 1–2 stabilization, healthy mix aspiration:

| Stream | Long-term mix (aspirational) |
| --- | --- |
| Premium memberships | 40–50% |
| Lead monetization | 30–40% |
| Advertising + featured | 10–20% |
| Services / enterprise | 5–10% |

Memberships stabilize cash flow; leads align price with value; ads monetize residual attention without taxing every inquiry.

---

## 5. Pricing strategy

### 5.1 Principles

1. **Free forever for parents** — non-negotiable for trust and SEO growth.  
2. **Free basic listing** — institutions can exist and receive organic benefit; paid upgrades unlock more demand.  
3. **Pay for outcomes or clear advantages** — leads, placement, badge, richer tools — not for “being in the database” alone.  
4. **Transparent disclosure** — paid placement must be labeled; organic SEO integrity preserved.  
5. **Türkiye-local pricing** — TRY pricing; seasonal campaigns for dershane peaks.  
6. **Start simple** — one Premium SKU + one lead SKU before complex catalogs.

### 5.2 Free tier (always-on acquisition)

| Included | Not included (paid) |
| --- | --- |
| Public profile (if published) | Featured / top-of-list placement |
| Appear in organic search & hubs | Guaranteed lead volume |
| Claim + edit core profile | Advanced analytics (future) |
| Lead inbox for claimed institutions (Phase 0–1 policy below) | Priority support / concierge |

**Phase 0 policy:** All leads free to claimed institutions to maximize adoption.  
**Phase 1 policy options** (choose one primary; see §7):

- Free allotment + pay-per-lead thereafter, or  
- Premium includes N leads/month; overage billed, or  
- Soft gate: free leads always; Premium only for visibility/tools (leads remain free longer)

### 5.3 Premium membership (indicative packaging)

| Plan | Indicative positioning | Indicative price band (TRY / month)* |
| --- | --- | --- |
| **Free** | Listed + claim + basic leads | ₺0 |
| **Premium** | Badge, richer media, hub highlights eligibility, lead notifications priority, basic insights | ₺1.500–4.000 |
| **Premium Plus** (later) | Multi-branch, featured credits, higher lead caps | ₺4.000–10.000+ |

\*Bands are **strategy placeholders** for sales testing, not committed list prices. Finalize with willingness-to-pay interviews after Phase 0 metrics.

**Annual discount:** ~2 months free equivalent to improve cash collection.

### 5.4 Lead pricing (indicative)

| Approach | When to use | Indicative mechanic |
| --- | --- | --- |
| **Pay-per-lead (PPL)** | Clear vertical ROI (anaokulu, dil) | Fixed fee per qualified lead by city/type |
| **Lead packs** | Predictable budgeting | 10 / 25 / 50 lead packs |
| **Shared inbox free + unlock** | Low trust early monetization | First N free; unlock details for fee (use carefully — hurts UX) |

**Qualification rule (commercial):** Billable lead = valid phone + consent + non-spam status; optional “unique per institution per 30 days.”

### 5.5 Featured placement pricing (indicative)

- Sold per **city + type** or **district + type** hub.  
- Time-boxed (e.g., 30 days).  
- Inventory capped so hubs do not look like pure ads.  
- Price scales with traffic (İstanbul districts ≫ small cities).

### 5.6 Discount & sales rules

- Pilot cohorts: 30–50% off for first 20 Premium logos in priority districts (case studies).  
- No permanent free Premium (deadlines on trials).  
- Agencies: standard wholesale later; avoid one-off custom deals that break packaging.

---

## 6. Institution acquisition

Supply coverage is a **product** requirement (SEO, trust) and a **sales** funnel.

### 6.1 Acquisition funnel

```text
Seed listing → Claim invite → Activated owner → Lead value proof → Premium / lead pay
```

### 6.2 Channels

| Channel | Tactic | Cost profile |
| --- | --- | --- |
| **Data seeding** | Build ≥500 published profiles for launch categories | High ops / low cash |
| **Claim outreach** | Email/WhatsApp/phone: “Kurumunuz EduAtlas’ta — sahiplenin” | Low–medium |
| **Inbound claim** | CTA on unclaimed pages (“Bu kurumu sahiplen”) | Marginal |
| **SEO halo** | Institutions search their own name and find EduAtlas | Organic |
| **Partnerships** | Local education associations, franchise HQs | Medium |
| **Field / SDR** | Priority districts (Kadıköy, Çankaya, Karşıyaka, …) | Higher touch |
| **Content proof** | Share lead anonymized stats after Phase 0 | Trust builder |

### 6.3 Activation criteria (supply)

An institution is **commercially activated** when:

1. Profile is Published with required fields, and  
2. Claim is Approved, and  
3. Owner has logged into Institution Panel at least once, and  
4. At least one Lead has been viewed (or 14 days elapsed with notification).

### 6.4 Prioritization

| Priority | Why |
| --- | --- |
| 1 — Dense districts in İstanbul / Ankara / İzmir | SEO + willingness to pay |
| 2 — Anaokulu / kreş / dil | High parent intent, clear LTV |
| 3 — Dershane pre-season | Timing with enrollment budgets |
| 4 — Long-tail cities | Coverage for national SEO, later monetization |

### 6.5 Unit economics (supply)

Track:

- Cost per claimed institution  
- Cost per activated institution  
- Time-to-first-lead after claim  
- Conversion claim → paid (Phase 1+)

---

## 7. Parent (demand) acquisition

Parents are acquired primarily through **organic search**, not paid social as the foundation.

### 7.1 Channels

| Channel | Role |
| --- | --- |
| **SEO hub pages** | City, district, type, city+type, district+type |
| **Institution pages** | Brand + “near me” modifier queries |
| **Brand search** | Grows after PR and institution sharing |
| **Social / WhatsApp share** | Amplification, not primary acquisition |
| **Paid search** | Optional accelerator on high-intent keywords after organic baseline — never the only plan |

### 7.2 Conversion path

```text
SERP → Hub or Institution page → Compare mentally → Lead form → Confirmation
```

Optimize for:

- Mobile form completion  
- Trust cues (claimed badge, clear address/phone)  
- Fast pages (SEO + conversion)

### 7.3 Demand principles

1. Never gate content behind login (MVP and beyond for core discovery).  
2. Never sell parent data as a standalone product.  
3. Consent on every lead — commercial and legal requirement.  
4. Seasonal content alignment (kayıt dönemleri, YKS, dil sınavları).

---

## 8. Lead monetization

Leads are the **core economic object**: proof of demand in Phase 0; priced product in Phase 1.

### 8.1 Lead value chain

```text
Parent intent → Form submit → Validation/spam filter → Delivery to owner/admin → Institution contact → Enrollment (off-platform)
```

EduAtlas monetizes **delivery of intent**, not tuition.

### 8.2 What makes a lead valuable

| Signal | Why |
| --- | --- |
| Local match (district/city) | Visit likelihood |
| Correct institution type | Intent alignment |
| Phone + consent | Actionable |
| Message specificity | Higher close rate |
| Low spam / duplicate rate | Institution trust |

### 8.3 Monetization modes

| Mode | Description | Pros | Cons |
| --- | --- | --- | --- |
| **A. Included in Premium** | N leads/month in subscription | Simple sales story | Heavy users underpay |
| **B. Pay-per-lead** | Fee per qualified lead | Aligns with value | Revenue volatility; disputes |
| **C. Hybrid (recommended)** | Premium includes N; overage PPL or packs | Balance | Slightly more packaging work |
| **D. Exclusive vs shared** | Exclusive lead costs more | Higher willingness | Lower fill rate |

**Recommended default for Phase 1:** Hybrid (C) with generous free trial period post-claim.

### 8.4 Unclaimed institutions

- Leads retained by platform Admin queue.  
- Used as **sales wedge**: “X parents asked about you — claim to respond.”  
- Upon claim, historical leads become visible per product policy (recommended: yes, for trust).

### 8.5 Guardrails

- Spam and test leads not billable.  
- Clear dispute window (e.g., 72 hours).  
- No dark patterns that invent leads.  
- Cap contact frequency to protect parents.

---

## 9. Premium memberships

### 9.1 Job of Premium

Convert “listed institution” into **paying customer** by selling:

1. **Trust & branding** — Premium badge on profile and cards  
2. **Visibility** — eligibility for hub highlights / better presentation  
3. **Operations** — faster notifications, lead tools, completeness prompts  
4. **Defense** — control of canonical profile competitors cannot easily hijack  

### 9.2 Entitlements (commercial definition)

| Entitlement | Free | Premium |
| --- | --- | --- |
| Public profile | Yes | Yes |
| Claim & edit | Yes | Yes |
| Claimed badge | Yes | Yes |
| Premium badge | No | Yes |
| Extra photos / richer gallery | Limited | Expanded |
| Hub “öne çıkan” eligibility | No | Yes (subject to inventory rules) |
| Lead inbox | Yes | Yes |
| Lead quota / overage terms | Phase policy | Preferential |
| Basic performance snapshot | Minimal | Yes (views, leads — when built) |
| Priority claim/support | No | Yes |

### 9.3 Sales motion

1. Claim → receive leads → show panel metrics  
2. Offer trial Premium (14–30 days)  
3. Convert to monthly/annual  
4. Expand to featured placement add-on  

### 9.4 Success condition

Premium is healthy when:

- Paid institutions retain ≥ month 3, and  
- They receive **more or better-handled** demand than Free, without destroying Free SEO value.

---

## 10. Future advertising

Advertising is **Phase 2** — after organic trust is established.

### 10.1 Inventory (conceptual)

| Placement | Buyer | Risk if abused |
| --- | --- | --- |
| Hub page display units | Institutions or third parties | Thin/spammy hubs |
| Search result sponsored slots | Institutions | Ranking distrust |
| Newsletter / seasonal guides | Edtech brands | Low early volume |
| Campaign entity boosts | Institutions | Overlap with Premium — keep packaging clear |

### 10.2 Rules

1. **Label all paid media** (“Sponsorlu” / “Öne çıkan”).  
2. **Organic results remain organic** — ads are separate modules.  
3. **Category relevance** — only education-appropriate advertisers.  
4. **Cap density** — e.g., max 1–2 sponsored slots above organic lists.  
5. **No payday-loan style off-vertical ads.**

### 10.3 Pricing approaches (future)

- CPM on hub pages with meaningful traffic  
- Flat weekly takeover for district hubs  
- Self-serve Campaign boost credits tied to `Campaign` entity in domain model  

### 10.4 Why wait

Advertising too early:

- Cannibalizes trust before brand strength  
- Distracts from claim and lead product  
- Requires traffic scale to be worth sales time  

---

## 11. Cost structure (business view)

| Cost category | Examples | Notes |
| --- | --- | --- |
| **Catalog ops** | Data seeding, claim review, QA | Dominant early |
| **Product & engineering** | Platform, SEO surfaces, panels | Fixed build cost |
| **Infrastructure** | Hosting, auth, storage, email | Scales with traffic |
| **Marketing** | Light brand; optional paid search tests | Keep SEO-first |
| **Sales** | SDR/account for Premium & leads | Grows Phase 1 |
| **Compliance** | KVKK, consent, security | Non-optional |

**Margin thesis:** High gross margin software + lead products; ops cost falls as claims shift updates to owners.

---

## 12. KPIs

### 12.1 North-star

**Qualified leads delivered to institutions per week**  
(Leading indicator of both parent value and future revenue.)

### 12.2 Funnel KPIs

| Stage | KPI |
| --- | --- |
| Awareness | Organic sessions; indexed pages; impressions (Search Console) |
| Supply | Published institutions; % claimed; claim approval time |
| Activation | Owners logged in; profiles completed |
| Conversion | Lead submit rate (institution page → lead); leads / session |
| Quality | Spam rate; lead → contacted rate (owner-reported) |
| Revenue (Phase 1+) | Premium subscribers; ARPU; lead revenue; logo churn |
| Unit economics | CAC (institution); payback period; LTV (institution) |

### 12.3 Phase 0 targets (align with PRD)

| KPI | Launch / 90-day direction |
| --- | --- |
| Published institutions | ≥ 500 at launch readiness |
| Priority city coverage | İstanbul, Ankara, İzmir + agreed set |
| Approved claims | ≥ 50 in 90 days |
| Lead requests | ≥ 200 in 90 days |
| Organic traffic | Week-over-week growth after indexation |
| Indexed SEO URLs | Majority of published indexables |

### 12.4 Phase 1 monetization KPIs

| KPI | Intent |
| --- | --- |
| % claimed that start trial | Sales funnel health |
| Trial → paid conversion | Packaging fit |
| Monthly Premium churn | Product value |
| Billable lead attach rate | Monetization without killing trust |
| Revenue per published institution | Marketplace yield |

### 12.5 Guardrail KPIs (do not break)

| Guardrail | Why |
| --- | --- |
| Parent NPS / complaint rate | Trust |
| Spam lead % | Supply retention |
| Organic CTR on hubs | SEO quality |
| % results labeled sponsored | UX honesty |

---

## 13. Risks

### 13.1 Commercial & market risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Institutions unwilling to pay after free leads | Revenue delay | Hybrid pricing; prove ROI with metrics; featured as optional |
| Lead quality too low | Churn, brand damage | Validation, spam controls, district matching, dispute policy |
| Seasonal demand cliffs | Cash volatility | Annual Premium; diversify verticals (preschool + language + dershane) |
| Google algorithm / SEO dependency | Traffic shock | Diversify brand, email to owners, light paid tests; content quality bar |
| Competitor directories undercut on price | Pricing pressure | Win on claim UX, data quality, local SEO depth |
| Multi-sided chicken-egg | Empty cities → no parents | Seed density in fewer districts before national vanity |

### 13.2 Trust & regulatory risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| KVKK / consent failures | Fines, shutdown risk | Explicit consent, retention policy, DPA readiness |
| Fake claims | Wrong owner gets leads | Manual verification MVP; document checks |
| Paid placement without disclosure | Reputation / legal | Hard labeling rules |
| Parent spam / over-contact | Demand abandonment | Rate limits; institution guidelines |

### 13.3 Execution risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Monetizing before retention | Supply revolt | Stay Phase 0 until KPI gates |
| Overbuilding ads/billing | Miss launch | PRD out-of-scope discipline |
| Ops bottleneck on claims | Slow activation | SLAs; templates; later automation |
| Thin content SEO penalty | No traffic → no leads | Indexation rules from PRD/domain model |

### 13.4 Monetization kill criteria

Do **not** turn on paid leads if:

- Spam rate is high, or  
- Median owner response is poor, or  
- Claimed base is too small to feel fair, or  
- Premium packaging is not yet demoable.

---

## 14. Go-to-market sequence (commercial)

| Step | Action | Exit gate |
| --- | --- | --- |
| 1 | Launch free marketplace | PRD release criteria met |
| 2 | Drive claims in priority districts | ≥ 50 claims; leads flowing |
| 3 | Publish anonymized lead outcomes | Owners cite value |
| 4 | Introduce Premium trials | Trial conversion tracked |
| 5 | Introduce lead packs / overage | Low dispute rate |
| 6 | Add featured hubs | No organic trust drop |
| 7 | Open advertising | Hub traffic meaningful |

---

## 15. Strategic moats (business)

1. **Local SEO corpus** — district × type pages compounded over time  
2. **Claimed profile graph** — owners maintain freshness competitors scrape  
3. **Lead operational habit** — inbox becomes daily workflow  
4. **Category focus** — education-only depth vs generic directories  
5. **Trust** — verified claims + consent-based routing  

---

## 16. Open commercial decisions

Resolve before Phase 1 packaging lock:

1. Hybrid vs pure PPL vs Premium-only (leads free longer)?  
2. Exact TRY price points by vertical (anaokulu vs dershane)?  
3. Are historical unclaimed leads transferred on claim? (Recommended: yes)  
4. Exclusive leads vs shared across similar institutions? (Recommended: exclusive to one institution page)  
5. When to hire first sales hire vs founder-led sales?

---

## 17. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product | | | ☐ |
| Business / GTM | | | ☐ |
| Engineering (feasibility) | | | ☐ |

**Summary:** EduAtlas wins parent attention with SEO and free discovery, wins institution loyalty with claims and leads, and captures value through **premium memberships**, **lead monetization**, and later **advertising** — without charging families or compromising organic trust.
