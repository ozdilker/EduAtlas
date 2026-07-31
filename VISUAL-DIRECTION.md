# EduAtlas — Visual Direction

| Field | Value |
| --- | --- |
| **Product** | EduAtlas |
| **Document** | VISUAL-DIRECTION.md |
| **Version** | 1.0 |
| **Release** | Release-001 |
| **Status** | Binding visual direction source of truth |
| **Market** | Türkiye |
| **Last updated** | 15 July 2026 |

---

## Document control

This document defines **how EduAtlas should look and feel** across surfaces: design philosophy, emotional goals, inspirations, homepage / portal / dashboard philosophies, color psychology, card hierarchy, elevation, white space, and education-specific identity.

It is the permanent visual companion to:

| Document | Role |
| --- | --- |
| `BRAND-GUIDELINES.md` | Personality, logo, voice, photo/illustration/motion ethics |
| `DESIGN-SYSTEM.md` | Tokens, components, exact sizes & semantics |
| `UI-ARCHITECTURE.md` | Screens, shells, flows |
| `NAVIGATION.md` | Header, drawer, CTAs |
| `PRD.md` | Mission & MVP scope |

**Non-goals:** Implementation, pixel mockups, or replacing token tables in `DESIGN-SYSTEM.md`.

**Conflict rule:** Philosophy lives here; components/tokens live in `DESIGN-SYSTEM.md`; brand meaning lives in `BRAND-GUIDELINES.md`. UI work must satisfy all three.

**Feel targets (shared):** Professional · Trustworthy · Modern · Accessible · Simple.

---

## 1. Design philosophy

EduAtlas UI is **content-first product design** for high-stakes family decisions.

### 1.1 Core beliefs

1. **Clarity beats decoration** — One primary action per region; typography and facts outrank ornament.  
2. **Trust is a layout problem** — Steady hierarchy, honest empty states, and sober verification signal credibility more than gradients.  
3. **Cards are not the default** — Prefer open layout with spacing and type; wrap in cards only when the block is an interaction unit.  
4. **One language, three densities** — Public, Owner, Admin share tokens; they differ in rhythm, chrome, and compressiveness.  
5. **Light mode first** — Cool neutrals (`neutral.25`), not cream paper or dark-by-default SaaS.  
6. **Local-first atlas** — Geography and institution type structure discovery more than national brand spectacle.  
7. **Restraint is premium** — Fewer accents, quieter motion, no sticker chrome.

### 1.2 Composition rules (always on)

- Brand-visible on public marketing first viewports.  
- No hero sticker clutter or floating promo badges on media.  
- No pill-cluster chrome, glow stacks, or emoji UI.  
- Prefer border + spacing over shadow.  
- Design for longer Turkish strings from day one.

### 1.3 North-star craft references (feel, not clone)

Think **Stripe** (trust via type & space), **Linear** (calm product density), **Vercel** (precise, airy systems), **Notion** (readable content hierarchy) — mixed with **Google-like search clarity** and **Airbnb-like discovery empathy** only where parents browse institutions.

Do **not** copy fintech dark gradients, Material purple, or marketplace-only card grids as the whole product metaphor.

---

## 2. Emotional goals

Parents choose schools under stress. Owners manage reputation and inbound interest. Visual emotion must reduce anxiety, never amplify urgency.

| Emotion to create | How visuals contribute |
| --- | --- |
| **Safety** | Stable teal-ink, clear focus, predictable patterns |
| **Competence** | Precise forms, aligned columns, consistent profile anatomy |
| **Orientation** | Place-first hubs, breadcrumbs, calm search results |
| **Respect** | Adult typography; no infantilizing illustrations in product chrome |
| **Momentum without pressure** | One clear CTA; no countdown timers or scare tactics |
| **Honesty** | Incomplete profiles look incomplete; no fake richness |

| Emotion to avoid | Typical failure mode |
| --- | --- |
| Hype / FOMO | Urgency badges, neon “limited” treatments |
| Confusion | Competing CTAs, card spam, weak hierarchy |
| Cold bureaucracy | Dense gray slabs, unreadable tables as the only metaphor |
| Childish play | Mascots, sticker heroes, candy color systems |

### 2.1 Emotional split by audience

| Audience | Desired felt sense |
| --- | --- |
| Parent on home/search | “I can find options quickly and trust what I see.” |
| Parent on profile | “I understand this institution enough to contact them.” |
| Owner in portal | “This is a serious tool that helps me respond and improve.” |
| Admin | “I can process queues without visual noise.” |

---

## 3. UI inspirations

Borrow principles; never paste entire visual systems.

| Reference | Borrow | Do not copy |
| --- | --- | --- |
| **Stripe** | Whitespace + typography trust; precise forms; enterprise calm | Fintech-only dark drama; glass stacks |
| **Linear** | Quiet product chrome; focused interaction; restrained motion | Issue-tracker aesthetics as parent UX |
| **Vercel** | System clarity; sharp hierarchy; modern engineering taste | Developer-console vibe on public marketing |
| **Notion** | Content readability; soft sectioning; calm neutrals | Doc-app sidebars as the only public metaphor |
| **Google (Search / Maps-lite clarity)** | Scannable results; strong empty states; accessible defaults | Material purple; dense icon ornament |
| **Airbnb (selective)** | Discovery browsing rhythm; human photography; sticky CTAs done cleanly | Marketplace card grids as sole mental model; playful over-illustration |

### 3.1 Inspiration filter

Before adopting a pattern, ask:

1. Does it reduce parent decision anxiety?  
2. Does it keep Owner/Admin looking like the same brand?  
3. Does it violate anti-patterns (purple SaaS, cream+terracotta, broadsheet, glow)?  

If any answer fails, redesign.

---

## 4. Homepage philosophy

The homepage is **search-first orientation**, not a feature dump.

### 4.1 Job of the first viewport

Usually contain only:

1. **Brand** (hero-level EduAtlas signal)  
2. **One headline**  
3. **One short supporting sentence**  
4. **One search/CTA group**  
5. **One dominant visual plane** (atmosphere — photo or soft wash)

Do **not** pack stats strips, schedules, address blocks, or secondary promos into the first viewport.

### 4.2 Visual principles

| Principle | Direction |
| --- | --- |
| Brand first | Removing the nav must not remove brand identity |
| Full-bleed hero when photographic | Edge-to-edge plane; avoid inset media cards in hero |
| Quiet atmosphere | Soft neutral wash or rights-cleared education photography |
| Search as product | Search UI is the hero instrument, not a footer convenience |
| Secondary actions below | Claim / explore / cities as deliberate next steps |

### 4.3 Below the fold

Sections should feel like **chapters**: one purpose, one headline, one short support line. Discovery chips and trust cues stay restrained — not pill spam.

### 4.4 Anti-patterns

- Dashboard-like homepage  
- Floating badges on hero media  
- Multiple competing H1-level claims  
- Purple/indigo SaaS hero gradients  

---

## 5. Portal philosophy (Institution Owner)

The Owner portal is **ops infrastructure**, not a marketing microsite.

### 5.1 Emotional contract

Owners should feel they are in a **credible control room**: leads, profile quality, insights — with the same EduAtlas teal family, quieter than the public site.

### 5.2 Chrome direction

| Trait | Direction |
| --- | --- |
| Shell | Persistent app chrome (sidebar on desktop; compact rail on small screens) |
| Density | Medium — between marketing comfort and admin compact |
| Background | Flat calm `neutral.25`; **no marketing radial washes** |
| Navigation | Section tabs/links with clear selected state; preserve URL state |
| Hierarchy | Page title → short description → widgets/lists; one primary next action |

### 5.3 Content principles

- Widgets earn their card because they are interactive or metric units.  
- Lists of leads are interactive cards/rows — hover via border/background, not shadow lift.  
- Drawers/dialogs: calm overlay, focus trap, Esc to close — serious detail, not popups-as-ads.  
- Completeness and recommendations should coach, not shame.  
- Empty leads / empty insights look intentional and recoverable.

### 5.4 What portal must not become

- A second public brochure with hero photography  
- A CRM clone with noisy charts and animation  
- A dark-mode “pro” theme that forks the brand  

Align screen map with `UI-ARCHITECTURE.md` Institution Portal.

---

## 6. Dashboard philosophy

“Dashboard” means **Owner overview / insights / operational summary** — not a BI wall for parents.

### 6.1 Purpose

Help owners answer:

1. What needs attention now (leads)?  
2. Is our public profile trustworthy enough?  
3. Is EduAtlas contributing to acquisition (insights)?  

### 6.2 Visual rules

| Rule | Direction |
| --- | --- |
| Prioritize action | Pending leads and completeness ahead of vanity charts |
| Metric cards | Few, readable, consistent label/value/description rhythm |
| Charts | Simple bars/meters first; no chart-library spectacle required for Release-001 |
| Placeholders | Honest “coming soon” treatments — dashed, quiet shimmer — never fake data that looks live |
| Grid rhythm | Metrics can use 3 → 2 → 1 responsive collapse; lists keep vertical scan |
| Recommendations | Structured, calm, rule-labeled; not notification spam |

### 6.3 Hierarchy inside a dashboard view

1. Page identity (eyebrow + H1 + one sentence)  
2. Attention widgets (leads summary, completeness)  
3. Supporting metrics / trends  
4. Deep lists or secondary CTAs (pipeline, public profile)  

### 6.4 Anti-patterns

- Kitchen-sink KPI grids with equal visual weight  
- Glow charts and gradient metric tiles  
- Embedding marketing hero aesthetics into dashboard panels  

---

## 7. Color psychology

Reference palette lives in `DESIGN-SYSTEM.md`. This section defines **meaning**.

### 7.1 Primary teal-ink (`#0F6B6B` family)

| Psychological role | Product meaning |
| --- | --- |
| Calm competence | Education + trust without hospital-green or playground-bright |
| Steadiness | Long-form parent decisions benefit from non-aggressive brand color |
| Differentiation | Avoids purple AI-SaaS and generic “Google blue only” |

Use for primary actions, key links, selected quiet surfaces (`primary.50` / `primary.100`).

### 7.2 Secondary ink-blue (`#1F4B7A` family)

Reserved for secondary emphasis, informational accents, and alternate CTAs — **sparingly**. If primary and secondary compete, remove secondary from the region.

### 7.3 Neutrals (cool, not cream)

| Role | Feeling |
| --- | --- |
| `neutral.25` page | Clean infrastructure paper — modern, not café stationery |
| White surfaces | Clarity islands for forms, cards, tables |
| Borders `neutral.100` | Soft structure without hairline newspaper density |
| Text ink/muted | Readable body; muted meta never fights titles |

### 7.4 Semantic status

Success / warning / error / info colors exist for **system truth**, not decoration. Always pair with text/icon.

### 7.5 Explicitly rejected psychology

| Look | Why rejected |
| --- | --- |
| Purple → indigo gradients | AI-template cliché; weak education trust |
| Warm cream + terracotta + display serif | Lifestyle cliché; wrong for portal ops |
| Neon / glow | Alarm and toy energy |
| National flag color systems as UI chrome | Politicizes a discovery product |

---

## 8. Card hierarchy

Cards are **earned**, not default.

### 8.1 When a card is allowed

Use a card when the container wraps a clear interaction or metric unit, for example:

- Institution result selection  
- Lead list item  
- Settings / profile editor groupings  
- Dashboard metric or recommendation modules  

### 8.2 When not to card

- Marketing hero  
- Whole page sections whose only job is typography  
- Navigation chrome  
- Every dashboard field “because dashboards use cards”

### 8.3 Visual hierarchy across card types

| Level | Treatment | Examples |
| --- | --- | --- |
| **L1 Interactive** | Border + hover border/background to `primary.100` / `neutral.25` | Results, lead rows |
| **L2 Metric / module** | Same surface language; stronger title weight; optional header actions | Completeness, insights metrics |
| **L3 Nested / quiet** | Dashed or softer empty interiors; less hover emphasis | Empty states, placeholders |
| **L4 Selected** | Primary soft fill + clearer border — selection must be obvious | Active lead, active filter chip |

### 8.4 Internal card typography

Title (semibold/bold) → value or body → muted meta. Avoid equal-weight text walls. Captions for timestamps/status.

### 8.5 Anti-patterns

- Multi-layer shadows as hover “lift”  
- Rounded-full pills as card chrome  
- Unequal radii/padding language across surfaces  

---

## 9. Elevation

EduAtlas prefers **structure over depth theater**.

### 9.1 Elevation scale (conceptual)

| Level | Method | Use |
| --- | --- | --- |
| **0 Flat** | Background only | Page canvas |
| **1 Surface** | White + 1px border | Default panels/cards |
| **2 Overlay** | Soft scrim + `shadow.sm` | Dialogs, drawers, menus |
| **3 Forbidden stacks** | Multi-shadow glow | Never |

### 9.2 Principles

- Border + spacing create hierarchy before shadow does.  
- Shadows are for **overlays** (dialog/drawer/dropdown), not for every card.  
- Sticky headers/sidebars use border separation, not floating shadow slabs.  
- Selected states use color tokens, not deeper shadows.

### 9.3 Portal/desktop notes

Owner drawers may sit in the top layer with a calm scrim (~40–50% ink). Feel like Linear/Notion overlays — quiet, opaque enough to focus, never theatrical glass blur stacks.

---

## 10. White-space principles

White space is a **trust material**.

### 10.1 Rules

1. **Breath around decisions** — Isolate primary CTAs; do not crowd “Bilgi Al” with secondary noise.  
2. **Section chapters** — Public sections use generous vertical rhythm; portals use medium; admin uses compact.  
3. **Scan paths** — Leave consistent gaps in lists so eyes can travel parent-name → preview → meta.  
4. **Avoid fake luxury voids** — Space must organize content, not look unfinished.  
5. **Touch honesty** — Mobile white space must still preserve ≥ 44px targets.

### 10.2 Density ladder

| Surface | White-space character |
| --- | --- |
| Homepage / marketing | Most breath; chaptered sections |
| Search & profiles | Medium breath; scannable facts |
| Owner portal | Controlled breath; sidebar/content separation |
| Admin | Least breath; still readable, never crushed |

### 10.3 Relationship to cards

If removing a card’s background/border/radius does not hurt understanding, prefer open layout — white space and type carry the structure.

---

## 11. Education-specific visual identity

EduAtlas must look like **education discovery infrastructure for Türkiye**, not a generic startup skin.

### 11.1 Distinctive ingredients

| Ingredient | Direction |
| --- | --- |
| **Atlas / place** | City → district → type orientation; local relevance over national vanity |
| **Institution truth** | NAP, verification, programs, galleries presented as facts, not ads |
| **Family decision gravity** | Calm CTAs; no carnival lead capture |
| **Dual surfaces** | Warmth on public photography; professionalism in owner ops — same brand DNA |
| **Turkish market craft** | TR string lengths, natural campus photography, sober trust badges |

### 11.2 Category awareness (visual)

Six MVP categories (özel okullar, dershaneler, etüt, dil, anaokulu, kreş) share one visual system. Differentiate with **labels and content**, not rainbow category themes that fracture the brand.

### 11.3 Trust artifacts

| Artifact | Visual stance |
| --- | --- |
| Claimed / Verified | Quiet soft badges — caption type, not oversized pills |
| Premium / Featured | Explicit secondary soft treatment + clear text label |
| Incomplete profile | Honest meters/hints; never fake completeness |

### 11.4 What would make it “not EduAtlas”

- Purple AI dashboard with “smart matches” spectacle as the home metaphor  
- Cream lifestyle magazine for boutique nurseries only  
- Government portal density as the parent experience  
- Social-network feed of schools  

### 11.5 Release-001 visual thesis (one sentence)

**A teal-ink, light, search-first atlas that helps Turkish families find and contact real institutions — and gives owners a calm, professional place to respond — without looking like hype SaaS or a toy.**

---

## 12. Surface quick-reference

| Surface | Philosophy one-liner |
| --- | --- |
| **Homepage** | Brand + search + atmosphere; one job |
| **Search / hubs** | Orientation and scan; local-first |
| **Institution profile** | Compare facts → contact |
| **Owner portal** | Ops calm; sidebar chrome; action over vanity |
| **Owner dashboard / insights** | Attention → metrics → coaching |
| **Admin** | Compact queues; same tokens |

---

## 13. Governance

### 13.1 Using this document

Before new UI work:

1. Read the relevant surface philosophy (§4–6).  
2. Check card/elevation/white-space rules (§8–10).  
3. Confirm brand personality & voice in `BRAND-GUIDELINES.md`.  
4. Implement with tokens from `DESIGN-SYSTEM.md`.  

### 13.2 Change control

Direction changes that alter philosophy (e.g., adopting dark-default, card-first marketing, new inspiration set) require an explicit revision of this document.

### 13.3 Release-001 acceptance (visual)

- [ ] Homepage first viewport matches §4  
- [ ] Owner portal reads as ops, not marketing (§5)  
- [ ] Dashboard prioritizes attention over decoration (§6)  
- [ ] Color usage matches teal-ink psychology (§7)  
- [ ] Cards are earned; elevation is restrained (§8–9)  
- [ ] Education-specific identity remains legible (§11)  

---

## Summary

EduAtlas visual direction is **restrained, trustworthy product craft**: Stripe/Linear/Vercel/Notion-level clarity applied to Turkish education discovery. Public surfaces orient and invite contact; portals operate; dashboards prioritize action. This document is the permanent visual-direction source of truth for Release-001 and all future UI work.
